import { execFileSync } from "node:child_process";

// Which CLI runs the skill + judge. Defaults to `claude`; override to swap in another
// AI CLI (it must accept claude-compatible -p / --output-format json flags).
export const AI_CLI = process.env.AI_CLI ?? "claude";
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
  /** Model alias passed to --model. */
  model?: string;
};

/** Is the CLI binary present? (Login is verified separately by an actual probe call.) */
export function isCliInstalled(): boolean {
  try {
    execFileSync(AI_CLI, ["--version"], { stdio: "ignore" });
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
  if (opts.model) args.push("--model", opts.model);

  const stdout = execFileSync(AI_CLI, args, {
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

/** Cheap probe: confirms the CLI is installed AND authenticated. Returns false if not. */
export function isCliReady(cwd: string): boolean {
  if (!isCliInstalled()) return false;
  try {
    const r = runCli("Reply with exactly: READY", { cwd });
    return r.result.includes("READY");
  } catch {
    return false;
  }
}
