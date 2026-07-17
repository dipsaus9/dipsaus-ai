import { describe, expect, it } from 'vitest'

import {
  DEFAULT_API_TIMEOUT_MS,
  DEFAULT_COOLDOWN_MS,
  DEFAULT_THRESHOLD_MS,
  loadConfig,
  type Config,
} from '../../hooks/dad-joke/config'
import { shouldTellJoke, type TriggerState } from '../../hooks/dad-joke/trigger'

const cfg = (over: Partial<Config> = {}): Config => ({
  thresholdMs: 30_000,
  cooldownMs: 60_000,
  disabled: false,
  apiEnabled: false,
  apiTimeoutMs: 800,
  colorEnabled: true,
  ...over,
})

const state = (over: Partial<TriggerState> = {}): TriggerState => ({
  turnStart: 1_000_000,
  lastJokeAt: null,
  ...over,
})

describe('shouldTellJoke', () => {
  it('is false when disabled, however long the turn has run', () => {
    expect(shouldTellJoke(1_999_999, state(), cfg({ disabled: true }))).toBe(false)
  })

  it('is false before the threshold has elapsed', () => {
    expect(shouldTellJoke(1_029_999, state(), cfg())).toBe(false)
  })

  it('is true once the turn passes the threshold and no joke has been told', () => {
    expect(shouldTellJoke(1_030_001, state(), cfg())).toBe(true)
  })

  it('is false within the cooldown of the last joke', () => {
    const s = state({ lastJokeAt: 1_030_000 })
    expect(shouldTellJoke(1_089_999, s, cfg())).toBe(false)
  })

  it('is true again once the cooldown has elapsed', () => {
    const s = state({ lastJokeAt: 1_030_000 })
    expect(shouldTellJoke(1_090_001, s, cfg())).toBe(true)
  })

  describe('boundaries are < not <=', () => {
    it('fires at exactly thresholdMs elapsed', () => {
      expect(shouldTellJoke(1_030_000, state(), cfg())).toBe(true)
      expect(shouldTellJoke(1_029_999, state(), cfg())).toBe(false)
    })

    it('fires at exactly cooldownMs since the last joke', () => {
      const s = state({ lastJokeAt: 1_030_000 })
      expect(shouldTellJoke(1_090_000, s, cfg())).toBe(true)
      expect(shouldTellJoke(1_089_999, s, cfg())).toBe(false)
    })
  })

  it('applies no cooldown gate when no joke has been told yet', () => {
    expect(shouldTellJoke(9_999_999, state({ lastJokeAt: null }), cfg())).toBe(true)
  })

  it('disabled beats every other condition', () => {
    const s = state({ lastJokeAt: null })
    expect(shouldTellJoke(9_999_999, s, cfg({ disabled: true }))).toBe(false)
  })
})

describe('loadConfig', () => {
  it('defaults on an empty env', () => {
    expect(loadConfig({})).toEqual({
      thresholdMs: DEFAULT_THRESHOLD_MS,
      cooldownMs: DEFAULT_COOLDOWN_MS,
      disabled: false,
      apiEnabled: false,
      apiTimeoutMs: DEFAULT_API_TIMEOUT_MS,
      colorEnabled: true,
    })
  })

  it('reads valid overrides', () => {
    const c = loadConfig({ DAD_JOKE_THRESHOLD_MS: '5000', DAD_JOKE_COOLDOWN_MS: '1000' })
    expect(c.thresholdMs).toBe(5000)
    expect(c.cooldownMs).toBe(1000)
  })

  it('accepts a zero threshold', () => {
    expect(loadConfig({ DAD_JOKE_THRESHOLD_MS: '0' }).thresholdMs).toBe(0)
  })

  it.each([
    ['non-numeric', 'abc'],
    ['blank', '   '],
    ['empty', ''],
    ['negative', '-1'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
  ])('falls back to the default on a %s override', (_label, raw) => {
    expect(loadConfig({ DAD_JOKE_THRESHOLD_MS: raw }).thresholdMs).toBe(DEFAULT_THRESHOLD_MS)
    expect(loadConfig({ DAD_JOKE_COOLDOWN_MS: raw }).cooldownMs).toBe(DEFAULT_COOLDOWN_MS)
  })

  it('never throws on a malformed override', () => {
    expect(() => loadConfig({ DAD_JOKE_THRESHOLD_MS: '}{', DAD_JOKE_COOLDOWN_MS: '💀' })).not.toThrow()
  })

  it.each(['1', 'true', 'yes', 'off'])('DAD_JOKE_DISABLE=%s disables', (raw) => {
    expect(loadConfig({ DAD_JOKE_DISABLE: raw }).disabled).toBe(true)
  })

  it.each([
    ['0', 'the documented "no, do not disable" escape hatch'],
    ['', 'an empty value'],
    ['  ', 'whitespace'],
  ])('DAD_JOKE_DISABLE=%s does not disable (%s)', (raw) => {
    expect(loadConfig({ DAD_JOKE_DISABLE: raw }).disabled).toBe(false)
  })

  it('is not disabled when the var is absent', () => {
    expect(loadConfig({}).disabled).toBe(false)
  })
})
