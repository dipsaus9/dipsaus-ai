#!/usr/bin/env bun
/**
 * backlog-workflow — the flow-* suite's deterministic reader. Ships in the plugin and is invoked as
 *
 *   bun "${CLAUDE_PLUGIN_ROOT}/bin/backlog-workflow.ts" <command> [args]
 *
 * with no build step (bun runs the TypeScript directly). Subcommands:
 *
 *   validate [configPath]     validate .claude/backlog-workflow.json; exit 1 on any error
 *   collisions <storyId>      list To Do / In Progress stories whose References collide; exit 1 if any
 *   verify-detect             print the ordered verify command list for this repo (may be empty)
 *
 * The impure glue lives here (filesystem + the `backlog` CLI); the decisions live in the pure,
 * unit-tested modules under src/workflow/.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

import { findCollisions, type StoryRefs } from '../src/workflow/collisions'
import { parseConfig } from '../src/workflow/schema'
import { detectVerify, type RepoProbe } from '../src/workflow/verify-detect'

const DEFAULT_CONFIG_PATH = '.claude/backlog-workflow.json'

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

/** Read a story's `References:` line via the backlog CLI. Empty when the story has none. */
function readStoryRefs(id: string): StoryRefs {
  const out = execFileSync('backlog', ['task', id, '--plain'], { encoding: 'utf8' })
  const line = out.split('\n').find((l) => l.startsWith('References:'))
  const references = line
    ? line
        .slice('References:'.length)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : []
  return { id, references }
}

/** Every story id in the given status (subtask ids only — DIP-n.m, never bare epics). */
function storyIdsInStatus(status: string): string[] {
  const out = execFileSync('backlog', ['task', 'list', '-s', status, '--plain'], {
    encoding: 'utf8',
  })
  const ids = new Set<string>()
  for (const m of out.matchAll(/\b([A-Z]+-\d+\.\d+)\b/g)) ids.add(m[1] as string)
  return [...ids]
}

function cmdValidate(configPath: string): void {
  if (!existsSync(configPath)) fail(`No config at ${configPath}`)
  let json: unknown
  try {
    json = JSON.parse(readFileSync(configPath, 'utf8'))
  } catch (e) {
    fail(`${configPath}: not valid JSON (${(e as Error).message})`)
  }
  const result = parseConfig(json)
  if (result.ok) {
    process.stdout.write(`${configPath}: valid\n`)
    return
  }
  const lines = result.issues.map((i) => `  ${i.path}: ${i.message}`).join('\n')
  fail(`${configPath}: invalid\n${lines}`)
}

function cmdCollisions(id: string): void {
  const target = readStoryRefs(id)
  if (target.references.length === 0) fail(`${id} declares no References — cannot check collisions`)
  const others = [...storyIdsInStatus('To Do'), ...storyIdsInStatus('In Progress')]
    .filter((other) => other !== id)
    .map(readStoryRefs)
  const hits = findCollisions(target, others)
  if (hits.length === 0) {
    process.stdout.write(`${id}: no collisions\n`)
    return
  }
  const lines = hits.map((h) => `  ${h.id}: ${h.references.join(', ')}`).join('\n')
  fail(`${id} collides with:\n${lines}`)
}

/** Gather repo signals for verify-detect from the filesystem. */
function probeRepo(): RepoProbe {
  const probe: RepoProbe = {}
  if (existsSync('package.json')) {
    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
        scripts?: Record<string, string>
      }
      probe.packageScripts = pkg.scripts ?? {}
    } catch {
      probe.packageScripts = {}
    }
    probe.nodePackageManager = existsSync('bun.lock')
      ? 'bun'
      : existsSync('pnpm-lock.yaml')
        ? 'pnpm'
        : 'npm'
  }
  if (existsSync('pyproject.toml')) {
    probe.hasPyproject = true
    try {
      probe.pyprojectHasRuff = /\[tool\.ruff\b/.test(readFileSync('pyproject.toml', 'utf8'))
    } catch {
      probe.pyprojectHasRuff = false
    }
  }
  probe.hasGoMod = existsSync('go.mod')
  probe.hasCargo = existsSync('Cargo.toml')
  return probe
}

function cmdVerifyDetect(): void {
  const commands = detectVerify(probeRepo())
  process.stdout.write(commands.length > 0 ? `${commands.join('\n')}\n` : '')
}

function main(argv: string[]): void {
  const [command, ...rest] = argv
  switch (command) {
    case 'validate':
      cmdValidate(rest[0] ?? DEFAULT_CONFIG_PATH)
      return
    case 'collisions':
      if (!rest[0]) fail('usage: collisions <storyId>')
      cmdCollisions(rest[0])
      return
    case 'verify-detect':
      cmdVerifyDetect()
      return
    default:
      fail(`unknown command: ${command ?? '(none)'} — expected validate | collisions | verify-detect`)
  }
}

main(process.argv.slice(2))
