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

export function buildUserPrompt(fixture: FixtureCase): string {
  const files = Object.entries(fixture.sources)
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
