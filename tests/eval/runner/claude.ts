import { spawn } from "node:child_process";

export interface InvokeOptions {
  bin: string;
  model: string;
  systemAppend: string;
  prompt: string;
  timeoutMs: number;
  /** working directory for the CLI (apply mode runs inside the sandbox) */
  cwd?: string;
  /** extra CLI args, e.g. tool permissions for apply mode */
  extraArgs?: string[];
}

export interface InvokeResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

/** One headless `claude -p` call. Full binary path — never a shell wrapper.
 * The prompt goes in via stdin: variadic flags like --allowedTools would
 * otherwise swallow a positional prompt argument. */
export function invokeClaude(options: InvokeOptions): Promise<InvokeResult> {
  return new Promise((resolve) => {
    const child = spawn(
      options.bin,
      [
        "-p",
        "--output-format",
        "text",
        "--model",
        options.model,
        "--append-system-prompt",
        options.systemAppend,
        ...(options.extraArgs ?? []),
      ],
      { stdio: ["pipe", "pipe", "pipe"], cwd: options.cwd },
    );
    child.stdin.write(options.prompt);
    child.stdin.end();

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      resolve({ ok: false, stdout, stderr, error: `timeout after ${options.timeoutMs}ms` });
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, stdout, stderr, error: String(error) });
    });
    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      if (code === 0) {
        resolve({ ok: true, stdout, stderr });
      } else {
        const hint = (stderr || stdout).trim().slice(0, 300);
        resolve({ ok: false, stdout, stderr, error: `exit code ${code}${hint ? `: ${hint}` : ""}` });
      }
    });
  });
}
