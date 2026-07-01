import { fileURLToPath } from "node:url";
import { JUDGE_MODEL, runCli } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

export type CheckResult = { pass: boolean; reason: string };

/**
 * Binary AI check in a separate context: given refactored code and one yes/no rule
 * question, answer PASS or FAIL. Binary judgments are far more stable than 0-100 scores.
 */
export function binaryCheck(code: string, rule: string): CheckResult {
  const prompt = [
    "You validate whether a refactored React/TypeScript file satisfies ONE rule.",
    "Answer strictly: first line is a single word, PASS or FAIL. Second line: one short reason.",
    "Judge only the rule below. If the rule's concern is genuinely absent from the code, PASS.",
    "",
    `RULE: ${rule}`,
    "",
    "REFACTORED CODE:",
    "```tsx",
    code,
    "```",
  ].join("\n");

  const out = runCli(prompt, { cwd: repoRoot, model: JUDGE_MODEL }).result;
  const firstLine = out.split("\n").find((l) => l.trim().length > 0)?.trim() ?? "";
  if (!/\b(PASS|FAIL)\b/i.test(firstLine)) {
    throw new Error(`check returned no PASS/FAIL on first line. Got: ${out.slice(0, 160)}`);
  }
  return { pass: /^pass\b/i.test(firstLine), reason: out.trim().slice(0, 200) };
}
