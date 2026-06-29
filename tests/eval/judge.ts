import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JUDGE_MODEL, runCli } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const rubricPath = new URL("../../tests/rubrics/react.md", import.meta.url);

function buildPrompt(fixture: string, report: string): string {
  const rubric = readFileSync(rubricPath, "utf8");
  return [
    "You are an impartial judge scoring a code-review report against a rubric.",
    `The report under review is for the fixture: ${fixture}`,
    "",
    "=== RUBRIC ===",
    rubric,
    "",
    "=== REPORT TO SCORE ===",
    report,
    "",
    "=== INSTRUCTIONS ===",
    "Apply the rubric's scoring method and the answer key for this exact fixture.",
    'Respond with ONLY a JSON object on a single line: {"score": <integer 0-100>}.',
    "No prose, no code fences.",
  ].join("\n");
}

/** Score a skill report for a fixture against the rubric. Returns an integer 0-100. */
export function judgeReport(fixture: string, report: string): number {
  const r = runCli(buildPrompt(fixture, report), { cwd: repoRoot, model: JUDGE_MODEL });
  const match = r.result.match(/\{[^}]*"score"\s*:\s*(\d{1,3})[^}]*\}/);
  if (!match?.[1]) {
    throw new Error(`judge did not return a score JSON. Got: ${r.result.slice(0, 200)}`);
  }
  const score = Number(match[1]);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`judge returned out-of-range score: ${match[1]}`);
  }
  return score;
}
