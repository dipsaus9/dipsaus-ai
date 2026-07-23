import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FixtureCase, FixtureLabels } from "./types";

const EVAL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FIXTURES_ROOT = path.join(EVAL_ROOT, "fixtures");
export const SKILL_MD_PATH = path.resolve(
  EVAL_ROOT,
  "../../skills/react-architecture/SKILL.md",
);

/** Every fixture directory carrying an expected.json, as category/name. */
export function discoverCases(filter?: string): FixtureCase[] {
  const cases: FixtureCase[] = [];
  for (const category of readdirSync(FIXTURES_ROOT, { withFileTypes: true })) {
    if (!category.isDirectory()) {
      continue;
    }
    const categoryDir = path.join(FIXTURES_ROOT, category.name);
    for (const entry of readdirSync(categoryDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const dir = path.join(categoryDir, entry.name);
      const labelsPath = path.join(dir, "expected.json");
      if (!existsSync(labelsPath)) {
        continue;
      }
      const name = `${category.name}/${entry.name}`;
      if (filter && !name.includes(filter)) {
        continue;
      }
      const labels = JSON.parse(readFileSync(labelsPath, "utf8")) as FixtureLabels;
      const sources: Record<string, string> = {};
      for (const file of Object.keys(labels.files)) {
        sources[file] = readFileSync(path.join(dir, file), "utf8");
      }
      cases.push({ name, dir, labels, sources });
    }
  }
  return cases.sort((a, b) => a.name.localeCompare(b.name));
}

export function readSkillMd(): string {
  return readFileSync(SKILL_MD_PATH, "utf8");
}
