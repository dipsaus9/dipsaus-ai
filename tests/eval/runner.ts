import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

// Which CLI runs the skill + judge. Defaults to `claude`; override to swap in another
// AI CLI (it must accept claude-compatible -p / --output-format json flags).
export const AI_CLI = process.env.AI_CLI ?? "claude";

// Resolve AI_CLI to a runnable path. GUI-launched editors (VS Code, JetBrains) inherit a
// minimal launchd PATH that omits shell additions like ~/.local/bin, so a bare `claude`
// fails with ENOENT inside the test runner even though it works in a terminal. Fall back to
// known install locations so the eval runs regardless of how the process was launched.
const CLI_FALLBACK_DIRS = [
  join(homedir(), ".local", "bin"),
  join(homedir(), ".claude", "local"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/usr/bin",
];

let resolvedCli: string | undefined;
export function resolveCli(): string {
  if (resolvedCli) return resolvedCli;
  const runs = (cmd: string): boolean => {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  // Trust it as-is first (already on PATH, or an explicit path override).
  if (runs(AI_CLI)) return (resolvedCli = AI_CLI);
  // Bare name not on the runner's PATH — probe common install dirs + PATH entries.
  if (!AI_CLI.includes("/")) {
    const dirs = [...CLI_FALLBACK_DIRS, ...(process.env.PATH?.split(delimiter) ?? [])];
    for (const dir of dirs) {
      const candidate = join(dir, AI_CLI);
      if (existsSync(candidate) && runs(candidate)) return (resolvedCli = candidate);
    }
  }
  return (resolvedCli = AI_CLI); // give up; downstream call surfaces a clear ENOENT
}
// Model alias for the judge call.
export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? "sonnet";

// Neutralise the user's global output style (e.g. learning/insight blocks) so eval
// output is deterministic.
const CLEAN_SETTINGS = JSON.stringify({ outputStyle: "default" });

export type CliResult = {
  is_error: boolean;
  subtype?: string;
  num_turns?: number;
  result: string;
};

export type RunOptions = {
  /** Working directory for the call. */
  cwd: string;
  /** Load the repo as a plugin so its skills resolve via /skill-name. */
  pluginDir?: string;
  /** Grant tool access to these directories. */
  addDir?: string[];
  /** Whitelist of tools (e.g. ["Read"]). Omit for a no-tool text call (judge). */
  allowedTools?: string[];
  /** Permission mode, e.g. "acceptEdits" for apply-mode file edits. */
  permissionMode?: string;
  /** Model alias passed to --model. */
  model?: string;
};

/** Is the CLI binary present? (Login is verified separately by an actual probe call.) */
export function isCliInstalled(): boolean {
  try {
    execFileSync(resolveCli(), ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Run a single headless prompt and return the parsed JSON result. Throws on failure. */
export function runCli(prompt: string, opts: RunOptions): CliResult {
  const args = ["-p", prompt, "--output-format", "json", "--settings", CLEAN_SETTINGS];
  if (opts.pluginDir) args.push("--plugin-dir", opts.pluginDir);
  for (const dir of opts.addDir ?? []) args.push("--add-dir", dir);
  if (opts.allowedTools?.length) args.push("--allowedTools", opts.allowedTools.join(" "));
  if (opts.permissionMode) args.push("--permission-mode", opts.permissionMode);
  if (opts.model) args.push("--model", opts.model);

  const stdout = execFileSync(resolveCli(), args, {
    cwd: opts.cwd,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });

  const parsed = JSON.parse(stdout) as CliResult;
  if (parsed.is_error) {
    throw new Error(`${AI_CLI} returned is_error for prompt: ${prompt.slice(0, 80)}`);
  }
  return parsed;
}

/**
 * Cheap probe: confirms the CLI is installed AND authenticated. Returns false if not,
 * logging the reason so a skipped eval is explained in the (VS Code) test output rather
 * than silently vanishing.
 */
export function isCliReady(cwd: string): boolean {
  if (!isCliInstalled()) {
    console.warn(
      `[eval] skipped: AI CLI "${AI_CLI}" not found (looked on PATH + ${CLI_FALLBACK_DIRS.join(", ")}). ` +
        `Install it or set AI_CLI to an absolute path.`,
    );
    return false;
  }
  try {
    const r = runCli("Reply with exactly: READY", { cwd });
    if (!r.result.includes("READY")) {
      console.warn(`[eval] skipped: CLI "${resolveCli()}" responded but not as expected.`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(
      `[eval] skipped: CLI "${resolveCli()}" not authenticated or errored — run \`${AI_CLI}\` once to log in. ` +
        `(${error instanceof Error ? error.message : String(error)})`,
    );
    return false;
  }
}
