import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * How the fixture gets refactored:
 * - "skill"    — the real react-architecture skill (plugin loaded, /react-architecture apply).
 * - "baseline" — no plugin: a generic "improve the architecture" prompt. Reference point
 *                for how much of the standard is met *without* the skill's guidance.
 */
export type Variant = "skill" | "baseline";

/** Refactor a fixture in a sandbox copy and return the resulting source. */
export function refactor(fixturePath: string, variant: Variant): string {
  const abs = resolve(repoRoot, fixturePath);
  const name = basename(fixturePath);
  const dir = mkdtempSync(join(tmpdir(), "eval-"));
  const dest = join(dir, name);
  try {
    copyFileSync(abs, dest);
    const prompt =
      variant === "skill"
        ? `/react-architecture apply ${name}`
        : `Refactor the React + TypeScript component in ${name} to improve its architecture. Edit the file in place and preserve behavior.`;
    runCli(prompt, {
      cwd: dir,
      pluginDir: variant === "skill" ? repoRoot : undefined,
      addDir: [dir],
      allowedTools: ["Read", "Edit", "Write"],
      permissionMode: "acceptEdits",
    });
    return readFileSync(dest, "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
