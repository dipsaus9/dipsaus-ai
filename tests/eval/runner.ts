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

/** Does `cmd --version` run without throwing? */
function cliRuns(cmd: string): boolean {
  try {
    execFileSync(cmd, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

let resolvedCli: string | undefined;
export function resolveCli(): string {
  if (resolvedCli) return resolvedCli;
  const runs = cliRuns;
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

export type CliUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export type CliResult = {
  is_error: boolean;
  subtype?: string;
  num_turns?: number;
  result: string;
  total_cost_usd?: number;
  duration_ms?: number;
  usage?: CliUsage;
};

// Running tally across an eval file so a slow, billed run can report what it cost.
export const evalUsage = { calls: 0, costUsd: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, durationMs: 0 };

export function resetEvalUsage(): void {
  evalUsage.calls = 0;
  evalUsage.costUsd = 0;
  evalUsage.inputTokens = 0;
  evalUsage.outputTokens = 0;
  evalUsage.cacheReadTokens = 0;
  evalUsage.durationMs = 0;
}

function track(r: CliResult): void {
  const u = r.usage ?? {};
  evalUsage.calls += 1;
  evalUsage.costUsd += r.total_cost_usd ?? 0;
  evalUsage.inputTokens += u.input_tokens ?? 0;
  evalUsage.outputTokens += u.output_tokens ?? 0;
  evalUsage.cacheReadTokens += u.cache_read_input_tokens ?? 0;
  evalUsage.durationMs += r.duration_ms ?? 0;
}

/** One-line, human-readable summary of everything spent so far. */
export function evalUsageSummary(): string {
  const secs = (evalUsage.durationMs / 1000).toFixed(0);
  return (
    `[eval] SPENT: ${evalUsage.calls} CLI calls · ${secs}s · ` +
    `in ${evalUsage.inputTokens.toLocaleString()} / out ${evalUsage.outputTokens.toLocaleString()} tok ` +
    `(cache read ${evalUsage.cacheReadTokens.toLocaleString()}) · $${evalUsage.costUsd.toFixed(4)}`
  );
}

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
  /** Short human label for progress/cost logs (e.g. "skill:god-component.tsx"). */
  label?: string;
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

// Transient API/network failures that are worth retrying rather than failing the eval —
// they reflect infra flakiness, not the skill under test.
const TRANSIENT = /API Error|Connection closed|Overloaded|ECONNRESET|ETIMEDOUT|network|rate.?limit|\b(429|500|502|503|529)\b/i;
const MAX_ATTEMPTS = 3;

/** Blocking sleep (sync context — execFileSync is synchronous). */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Run the CLI once; return parsed JSON even when the CLI exits non-zero but still emitted it. */
function runOnce(args: string[], opts: RunOptions): CliResult {
  try {
    const stdout = execFileSync(resolveCli(), args, {
      cwd: opts.cwd,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    return JSON.parse(stdout) as CliResult;
  } catch (error) {
    // Non-zero exit: the CLI often still printed a JSON result (e.g. is_error) to stdout.
    const stdout = (error as { stdout?: Buffer | string }).stdout?.toString() ?? "";
    if (stdout.trim().startsWith("{")) return JSON.parse(stdout) as CliResult;
    throw error;
  }
}

/** Run a headless prompt and return the parsed JSON result. Retries transient failures. */
export function runCli(prompt: string, opts: RunOptions): CliResult {
  const args = ["-p", prompt, "--output-format", "json", "--settings", CLEAN_SETTINGS];
  if (opts.pluginDir) args.push("--plugin-dir", opts.pluginDir);
  for (const dir of opts.addDir ?? []) args.push("--add-dir", dir);
  if (opts.allowedTools?.length) args.push("--allowedTools", opts.allowedTools.join(" "));
  if (opts.permissionMode) args.push("--permission-mode", opts.permissionMode);
  if (opts.model) args.push("--model", opts.model);

  const label = opts.label ?? prompt.slice(0, 48);
  let lastReason = "unknown";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const suffix = attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : "";
    console.log(`[eval] → running ${label}${suffix} …`);
    let result: CliResult;
    try {
      result = runOnce(args, opts);
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPTS && TRANSIENT.test(lastReason)) {
        console.warn(`[eval] transient error on ${label}, retrying: ${lastReason.slice(0, 80)}`);
        sleepSync(2000 * attempt);
        continue;
      }
      throw error;
    }
    if (!result.is_error) {
      track(result);
      const secs = ((result.duration_ms ?? 0) / 1000).toFixed(1);
      const u = result.usage ?? {};
      console.log(
        `[eval] ✓ ${label} — ${secs}s · in ${u.input_tokens ?? 0} / out ${u.output_tokens ?? 0} tok · $${(result.total_cost_usd ?? 0).toFixed(4)}`,
      );
      return result;
    }

    lastReason = result.result ?? "is_error";
    if (attempt < MAX_ATTEMPTS && TRANSIENT.test(lastReason)) {
      console.warn(`[eval] transient error on ${label} (attempt ${attempt}/${MAX_ATTEMPTS}), retrying: ${lastReason.slice(0, 80)}`);
      sleepSync(2000 * attempt);
      continue;
    }
    break;
  }
  throw new Error(`${AI_CLI} failed after ${MAX_ATTEMPTS} attempts for "${label}": ${lastReason.slice(0, 120)}`);
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
