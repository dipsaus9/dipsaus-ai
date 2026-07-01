import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Refactor a fixture in a sandbox copy and return the resulting source.
 * withSkill=true loads the plugin and triggers `/react-architecture apply`.
 * withSkill=false is the no-skill baseline: a generic "refactor for better architecture".
 */
export function refactor(fixturePath: string, withSkill: boolean): string {
  const abs = resolve(repoRoot, fixturePath);
  const name = basename(fixturePath);
  const dir = mkdtempSync(join(tmpdir(), "eval-"));
  const dest = join(dir, name);
  try {
    copyFileSync(abs, dest);
    const prompt = withSkill
      ? `/react-architecture apply ${name}`
      : `Refactor the React + TypeScript component in ${name} to improve its architecture. Edit the file in place and preserve behavior.`;
    runCli(prompt, {
      cwd: dir,
      pluginDir: withSkill ? repoRoot : undefined,
      addDir: [dir],
      allowedTools: ["Read", "Edit", "Write"],
      permissionMode: "acceptEdits",
    });
    return readFileSync(dest, "utf8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
