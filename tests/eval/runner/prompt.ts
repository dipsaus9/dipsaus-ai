import type { FixtureCase } from "./types";

/**
 * The skill is injected as a system-prompt append rather than relying on
 * headless plugin-skill resolution — deterministic and machine-independent.
 */
export function buildSystemPrompt(skillMd: string): string {
  return [
    "You are running the react-architecture skill in REVIEW mode on the files",
    "provided by the user. Apply the skill exactly as written below.",
    "",
    skillMd,
  ].join("\n");
}

/**
 * Control arm (A/B mode): the same output-format scaffolding and rule-id
 * vocabulary — the parser must work on both arms — but none of the skill's
 * standards content (no caps, severities, criteria, or fixes). What differs
 * between arms is the skill's substance, not its formatting.
 */
export function buildControlSystemPrompt(ruleIds: string[]): string {
  return [
    "You are an experienced React/TypeScript reviewer. Review (or refactor,",
    "when asked) the code provided by the user against your own judgment of",
    "good React architecture.",
    "",
    "When reporting review findings, use exactly this format, grouped under",
    "markdown headings:",
    "",
    "```",
    "## <Category>",
    "- [<severity>] `<rule-id>` <file>:<line> — <rule>",
    "  problem: <one-line what's wrong>",
    "  fix: <one-line concrete change>",
    "```",
    "",
    "severity is high, med or low by your own judgment. <rule-id> must be the",
    "closest match from this fixed vocabulary (never invent ids):",
    "",
    ...ruleIds.map((id) => `- \`${id}\``),
    "",
    "If nothing is wrong, output exactly: NO_FINDINGS",
  ].join("\n");
}

/** Good-twin files: the answer key. They must never share a prompt with the
 * violating files, or the model can find violations by diffing. */
export function isGoodTwin(file: string): boolean {
  return file === "Good.tsx" || file.startsWith("Good/");
}

export interface ReviewCall {
  /** detection = the violating files (Bad + Demo + support); precision = the
   * clean Good twin alone, graded purely on false positives */
  kind: "detection" | "precision";
  sources: Record<string, string>;
}

/**
 * Split one fixture into independent review calls so detection and precision
 * are measured separately. Fixtures without a Good twin keep a single call.
 */
export function splitReviewCalls(fixture: FixtureCase): ReviewCall[] {
  const detection: Record<string, string> = {};
  const precision: Record<string, string> = {};
  for (const [file, content] of Object.entries(fixture.sources)) {
    (isGoodTwin(file) ? precision : detection)[file] = content;
  }
  const calls: ReviewCall[] = [];
  if (Object.keys(detection).length > 0) {
    calls.push({ kind: "detection", sources: detection });
  }
  if (Object.keys(precision).length > 0) {
    calls.push({ kind: "precision", sources: precision });
  }
  return calls;
}

export function buildUserPrompt(sources: Record<string, string>): string {
  const files = Object.entries(sources)
    .map(([file, content]) => `### File: ${file}\n\n\`\`\`tsx\n${content}\`\`\``)
    .join("\n\n");
  return [
    "Review the following React/TypeScript files against the skill's standards.",
    "Output ONLY the review-mode findings report in the skill's format — every",
    "finding must carry its stable rule id, and file paths must be exactly the",
    "paths given here. Do not add prose before or after the report.",
    "If nothing violates the standards, output exactly: NO_FINDINGS",
    "",
    files,
  ].join("\n");
}
