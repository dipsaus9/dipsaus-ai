import { describe, expect, it, vi } from 'vitest'

import { loadConfig, type Config } from '../../hooks/dad-joke/config'
import { type Joke } from '../../hooks/dad-joke/pick'
import { getJoke, type Deps } from '../../hooks/dad-joke/source'

const POOL: Joke[] = [
  { id: 'pool-1', setup: 'Why did the pool joke fire?', punchline: 'Because the API did not.' },
  { id: 'pool-2', setup: 'Knock knock.', punchline: 'Fallback.' },
]

const cfg = (over: Partial<Config> = {}): Config => ({
  thresholdMs: 30_000,
  cooldownMs: 60_000,
  disabled: false,
  apiEnabled: true,
  apiTimeoutMs: 800,
  colorEnabled: true,
  ...over,
})

/** A fake `fetch` that returns a given status + body, with no network anywhere. */
const fakeFetch = (status: number, body: unknown): Deps['fetch'] =>
  vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as Deps['fetch']

const deps = (over: Partial<Deps> = {}): Deps => ({
  fetch: fakeFetch(200, { id: 'abc', joke: 'A live joke.' }),
  jokes: POOL,
  rand: () => 0,
  recentIds: [],
  ...over,
})

describe('getJoke — API disabled (the default)', () => {
  it('returns a pool joke and never touches fetch', async () => {
    const spy = vi.fn()
    const joke = await getJoke(cfg({ apiEnabled: false }), deps({ fetch: spy as unknown as Deps['fetch'] }))

    expect(POOL.map((j) => j.id)).toContain(joke.id)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('getJoke — API enabled', () => {
  it('returns the live joke on success', async () => {
    const joke = await getJoke(cfg(), deps())

    expect(joke.id).toBe('api-abc')
    expect(joke.setup).toBe('A live joke.')
    expect(joke.punchline).toBe('')
  })

  it('sends the Accept and User-Agent headers the API terms ask for', async () => {
    const spy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 'abc', joke: 'A live joke.' }),
    })) as unknown as Deps['fetch']

    await getJoke(cfg(), deps({ fetch: spy }))

    const [url, init] = (spy as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit & { headers: Record<string, string> },
    ]
    expect(url).toBe('https://icanhazdadjoke.com/')
    expect(init.headers.Accept).toBe('application/json')
    expect(init.headers['User-Agent']).toContain('github.com/dipsaus9/dipsaus-ai')
    expect(init.signal).toBeDefined()
  })

  it('falls back to the pool on a non-2xx status', async () => {
    const joke = await getJoke(cfg(), deps({ fetch: fakeFetch(503, {}) }))
    expect(POOL.map((j) => j.id)).toContain(joke.id)
  })

  it.each([
    ['a malformed body', { nope: true }],
    ['a missing joke field', { id: 'abc' }],
    ['a non-string joke', { id: 'abc', joke: 42 }],
    ['an empty joke', { id: 'abc', joke: '   ' }],
    ['a null body', null],
  ])('falls back to the pool on %s', async (_label, body) => {
    const joke = await getJoke(cfg(), deps({ fetch: fakeFetch(200, body) }))
    expect(POOL.map((j) => j.id)).toContain(joke.id)
  })

  it('falls back to the pool when the fetch throws (offline, DNS, proxy)', async () => {
    const boom = vi.fn(async () => {
      throw new Error('getaddrinfo ENOTFOUND')
    }) as unknown as Deps['fetch']

    const joke = await getJoke(cfg(), deps({ fetch: boom }))
    expect(POOL.map((j) => j.id)).toContain(joke.id)
  })

  it('falls back to the pool when the fetch times out', async () => {
    // Never resolves on its own — only the AbortController's signal ends it.
    const hang: Deps['fetch'] = ((_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('AbortError')))
      })) as unknown as Deps['fetch']

    const joke = await getJoke(cfg({ apiTimeoutMs: 10 }), deps({ fetch: hang }))
    expect(POOL.map((j) => j.id)).toContain(joke.id)
  })

  it('respects recentIds when it falls back', async () => {
    const joke = await getJoke(
      cfg(),
      deps({ fetch: fakeFetch(500, {}), recentIds: ['pool-1'] }),
    )
    expect(joke.id).toBe('pool-2')
  })
})

describe('config: the API knobs', () => {
  it('is off by default', () => {
    const c = loadConfig({})
    expect(c.apiEnabled).toBe(false)
    expect(c.apiTimeoutMs).toBe(800)
  })

  it('DAD_JOKE_API=1 enables it, =0 does not', () => {
    expect(loadConfig({ DAD_JOKE_API: '1' }).apiEnabled).toBe(true)
    expect(loadConfig({ DAD_JOKE_API: '0' }).apiEnabled).toBe(false)
  })

  it('falls back to the default timeout on a malformed override', () => {
    expect(loadConfig({ DAD_JOKE_API_TIMEOUT_MS: 'soon' }).apiTimeoutMs).toBe(800)
    expect(loadConfig({ DAD_JOKE_API_TIMEOUT_MS: '250' }).apiTimeoutMs).toBe(250)
  })
})
