/**
 * Guards the raw stdout bytes of both hook entrypoints, spawned as real subprocesses.
 *
 * Every other suite tests pure modules; this one tests the glue — which is where the feature
 * actually broke once: valid JSON, exit 0, joke never appeared, because the trailing newline
 * was missing and Claude Code silently ignores a payload without it. So the assertions here
 * are on BYTES, not parsed objects — a trailing newline is invisible to JSON.parse.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const POST_TOOL_USE = fileURLToPath(new URL('../../hooks/dad-joke/on-post-tool-use.ts', import.meta.url))
const USER_PROMPT_SUBMIT = fileURLToPath(
  new URL('../../hooks/dad-joke/on-user-prompt-submit.ts', import.meta.url),
)

const SESSION = 'entrypoint-test-session'

let pluginData: string

beforeEach(() => {
  pluginData = mkdtempSync(join(tmpdir(), 'dad-joke-entrypoints-'))
})

afterEach(() => {
  rmSync(pluginData, { recursive: true, force: true })
})

/**
 * Seed the state file directly — `turnStart` far in the past so the threshold has long
 * elapsed, `lastJokeAt: null` so no cooldown applies. Never sleep in a test.
 */
function seedElapsedTurn(): void {
  const dir = join(pluginData, 'dad-joke')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, `${SESSION}.json`),
    JSON.stringify({ turnStart: 1, lastJokeAt: null, recentIds: [] }),
    'utf8',
  )
}

/**
 * Spawn an entrypoint the way Claude Code does: `bun <path>` with the hook payload on stdin.
 * The env is built from scratch, not inherited — a DAD_JOKE_* or NO_COLOR var in the host
 * environment must not change what this suite observes. No network: DAD_JOKE_API stays unset.
 */
function runHook(entrypoint: string, stdin: string) {
  return spawnSync('bun', [entrypoint], {
    input: stdin,
    encoding: 'utf8',
    timeout: 10_000,
    env: { PATH: process.env.PATH, CLAUDE_PLUGIN_DATA: pluginData },
  })
}

const PAYLOAD = JSON.stringify({ session_id: SESSION })

describe('on-post-tool-use stdout contract', () => {
  it('exits 0 and emits newline-terminated valid JSON with a systemMessage key', () => {
    seedElapsedTurn()
    const { status, stdout } = runHook(POST_TOOL_USE, PAYLOAD)

    expect(status).toBe(0)
    // The trailing newline is load-bearing: without it Claude Code silently ignores the
    // payload. Asserted on the raw bytes, first and specifically.
    expect(stdout.endsWith('\n')).toBe(true)
    // Exactly one line: the payload itself contains no raw newlines before the terminator.
    expect(stdout.indexOf('\n')).toBe(stdout.length - 1)

    const parsed: unknown = JSON.parse(stdout)
    expect(typeof (parsed as { systemMessage?: unknown }).systemMessage).toBe('string')
  })

  it('never emits additionalContext or hookSpecificOutput — systemMessage is the only key', () => {
    seedElapsedTurn()
    const { stdout } = runHook(POST_TOOL_USE, PAYLOAD)

    expect(Object.keys(JSON.parse(stdout) as object)).toEqual(['systemMessage'])
  })

  it('exits 0 and stays silent on malformed stdin', () => {
    const { status, stdout } = runHook(POST_TOOL_USE, 'not json {{{')

    expect(status).toBe(0)
    expect(stdout).toBe('')
  })
})

describe('on-user-prompt-submit stdout contract', () => {
  it('exits 0 and writes nothing to stdout', () => {
    const { status, stdout } = runHook(USER_PROMPT_SUBMIT, PAYLOAD)

    expect(status).toBe(0)
    expect(stdout).toBe('')
  })

  it('exits 0 and stays silent on malformed stdin', () => {
    const { status, stdout } = runHook(USER_PROMPT_SUBMIT, 'not json {{{')

    expect(status).toBe(0)
    expect(stdout).toBe('')
  })
})
