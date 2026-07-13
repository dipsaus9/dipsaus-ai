import { describe, expect, it, vi } from 'vitest'

import jokesJson from '../../hooks/dad-joke/jokes.json'
import { pickJoke, type Joke } from '../../hooks/dad-joke/pick'

const jokes = jokesJson as Joke[]

/** Cycle the picker `count` times, threading each pick back in as history. */
function cycle(pool: Joke[], count: number, rand: () => number = () => 0): Joke[] {
  const recentIds: string[] = []
  const picked: Joke[] = []
  for (let i = 0; i < count; i++) {
    const joke = pickJoke(pool, recentIds, rand)
    picked.push(joke)
    recentIds.push(joke.id)
  }
  return picked
}

describe('jokes.json', () => {
  it('holds at least 40 well-formed jokes', () => {
    expect(jokes.length).toBeGreaterThanOrEqual(40)
    for (const joke of jokes) {
      expect(typeof joke.id).toBe('string')
      expect(typeof joke.setup).toBe('string')
      expect(typeof joke.punchline).toBe('string')
      expect(joke.setup.length).toBeGreaterThan(0)
      expect(joke.punchline.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate setups and no duplicate ids', () => {
    expect(new Set(jokes.map((j) => j.setup)).size).toBe(jokes.length)
    expect(new Set(jokes.map((j) => j.id)).size).toBe(jokes.length)
  })
})

describe('pickJoke', () => {
  it('never repeats across a full pool cycle', () => {
    const picked = cycle(jokes, jokes.length)
    expect(new Set(picked.map((j) => j.id)).size).toBe(jokes.length)
  })

  it('wraps around once the pool is exhausted', () => {
    const allIds = jokes.map((j) => j.id)
    const joke = pickJoke(jokes, allIds, () => 0)
    expect(allIds).toContain(joke.id)
  })

  it('keeps returning a valid joke past exhaustion rather than throwing', () => {
    const picked = cycle(jokes, jokes.length + 5)
    expect(picked).toHaveLength(jokes.length + 5)
    for (const joke of picked) {
      expect(jokes.map((j) => j.id)).toContain(joke.id)
    }
  })

  it('handles a single-joke pool, seen or unseen', () => {
    const only: Joke[] = [{ id: 'only', setup: 'Knock knock.', punchline: "Who's there? Just me." }]
    expect(pickJoke(only, [], () => 0).id).toBe('only')
    expect(pickJoke(only, ['only'], () => 0).id).toBe('only')
  })

  it('is deterministic under an injected rand', () => {
    const first = pickJoke(jokes, [], () => 0)
    const second = pickJoke(jokes, [], () => 0)
    expect(first.id).toBe(second.id)
    expect(first.id).toBe(jokes[0]?.id)
  })

  it('clamps an out-of-range rand instead of indexing off the end', () => {
    // Math.random is [0, 1), but rand is injected — a caller could hand us 1 or worse.
    expect(pickJoke(jokes, [], () => 1).id).toBe(jokes[jokes.length - 1]?.id)
    expect(pickJoke(jokes, [], () => 1.5)).toBeDefined()
    expect(pickJoke(jokes, [], () => -1).id).toBe(jokes[0]?.id)
  })

  it('never calls Math.random', () => {
    const spy = vi.spyOn(Math, 'random')
    cycle(jokes, 5)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('throws on an empty pool', () => {
    expect(() => pickJoke([], [], () => 0)).toThrow(/empty/)
  })
})
