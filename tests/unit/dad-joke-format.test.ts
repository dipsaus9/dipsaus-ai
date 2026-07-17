import { describe, expect, it } from 'vitest'

import { loadConfig } from '../../hooks/dad-joke/config'
import { formatJoke } from '../../hooks/dad-joke/format'

const JOKE = { id: 'x', setup: 'Why don’t skeletons fight each other?', punchline: 'They don’t have the guts.' }
const ONE_LINER = { id: 'api-1', setup: 'I used to be a banker, but I lost interest.', punchline: '' }

const COLOR_ON = loadConfig({})
const COLOR_OFF = loadConfig({ NO_COLOR: '1' })

describe('formatJoke — Tier 1 (colour off)', () => {
  it('renders the emoji marker + setup/punchline structure, with zero escape bytes', () => {
    const out = formatJoke(JOKE, COLOR_OFF)

    expect(out).toBe(`🥁 ${JOKE.setup}\n${JOKE.punchline}`)
    // Byte-identical means no stray reset codes either — assert the whole escape family away.
    expect(out.includes('\x1b')).toBe(false)
  })

  it('keeps a one-liner (empty punchline) on a single line', () => {
    const out = formatJoke(ONE_LINER, COLOR_OFF)

    expect(out).toBe(`🥁 ${ONE_LINER.setup}`)
    expect(out.includes('\n')).toBe(false)
  })
})

describe('formatJoke — Tier 2 (colour on)', () => {
  it('wraps the punchline in bold yellow, leaving the setup and marker untouched', () => {
    expect(formatJoke(JOKE, COLOR_ON)).toBe(
      `🥁 ${JOKE.setup}\n\x1b[1;33m${JOKE.punchline}\x1b[0m`,
    )
  })

  it('styles a one-liner as the punch, still on a single line', () => {
    const out = formatJoke(ONE_LINER, COLOR_ON)

    expect(out).toBe(`🥁 \x1b[1;33m${ONE_LINER.setup}\x1b[0m`)
    expect(out.includes('\n')).toBe(false)
  })

  it('is byte-identical to Tier 1 apart from the added escape sequences', () => {
    const colored = formatJoke(JOKE, COLOR_ON)
    // oxlint-disable-next-line no-control-regex -- stripping the escapes is the point here.
    expect(colored.replace(/\x1b\[[0-9;]*m/g, '')).toBe(formatJoke(JOKE, COLOR_OFF))
  })
})

describe('loadConfig colour knobs', () => {
  it('enables colour by default', () => {
    expect(loadConfig({}).colorEnabled).toBe(true)
  })

  it.each([
    ['NO_COLOR=1', { NO_COLOR: '1' }],
    ['NO_COLOR=true', { NO_COLOR: 'true' }],
    // no-color.org: ANY non-empty value disables — '0' included, unlike this repo's own flags.
    ['NO_COLOR=0', { NO_COLOR: '0' }],
    ['DAD_JOKE_NO_COLOR=1', { DAD_JOKE_NO_COLOR: '1' }],
  ])('disables colour for %s', (_label, env) => {
    expect(loadConfig(env).colorEnabled).toBe(false)
  })

  it('keeps colour on when NO_COLOR is present but empty', () => {
    expect(loadConfig({ NO_COLOR: '' }).colorEnabled).toBe(true)
  })

  it("keeps colour on for DAD_JOKE_NO_COLOR='0' — repo flag semantics, not the convention", () => {
    expect(loadConfig({ DAD_JOKE_NO_COLOR: '0' }).colorEnabled).toBe(true)
  })
})
