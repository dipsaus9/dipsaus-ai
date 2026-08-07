/**
 * Verify-command detection — resolves an ordered verify list from what a repo actually contains,
 * so delivery runs the right checks in any stack instead of assuming package.json.
 *
 * Pure: takes a `RepoProbe` (the signals the CLI gathers from the filesystem) and returns the
 * command list. The order mirrors the deliver contract's intent — lint / typecheck / test / build
 * for node, canonical build→lint→test elsewhere. A repo with no recognised manifest yields `[]`
 * (delivery then degrades to the story's own Verify), never an error.
 */

/** Signals the CLI reads from the repo and hands to the detector. */
export interface RepoProbe {
  /** Parsed package.json `scripts`, if a package.json exists. */
  packageScripts?: Record<string, string>
  /** Which node package manager lockfile is present. */
  nodePackageManager?: 'bun' | 'pnpm' | 'npm'
  hasPyproject?: boolean
  /** True if pyproject declares ruff (a `[tool.ruff]` section). */
  pyprojectHasRuff?: boolean
  hasGoMod?: boolean
  hasCargo?: boolean
}

/** node/bun: the canonical scripts, in the deliver order, that the repo actually defines. */
const NODE_SCRIPTS_IN_ORDER = ['lint', 'typecheck', 'test', 'build'] as const

function nodeCommands(probe: RepoProbe): string[] {
  const scripts = probe.packageScripts
  if (!scripts) return []
  const pm = probe.nodePackageManager ?? 'npm'
  return NODE_SCRIPTS_IN_ORDER.filter((s) => typeof scripts[s] === 'string').map(
    (s) => `${pm} run ${s}`,
  )
}

function pythonCommands(probe: RepoProbe): string[] {
  if (!probe.hasPyproject) return []
  const cmds: string[] = []
  if (probe.pyprojectHasRuff) cmds.push('ruff check .')
  cmds.push('pytest')
  return cmds
}

function goCommands(probe: RepoProbe): string[] {
  if (!probe.hasGoMod) return []
  return ['go build ./...', 'go vet ./...', 'go test ./...']
}

function rustCommands(probe: RepoProbe): string[] {
  if (!probe.hasCargo) return []
  return ['cargo build', 'cargo clippy', 'cargo test']
}

/**
 * Resolve the ordered verify list. Multiple stacks can coexist (a polyglot repo), so their
 * command lists are concatenated in a stable order. No manifest matched ⇒ `[]`.
 */
export function detectVerify(probe: RepoProbe): string[] {
  return [
    ...nodeCommands(probe),
    ...pythonCommands(probe),
    ...goCommands(probe),
    ...rustCommands(probe),
  ]
}
