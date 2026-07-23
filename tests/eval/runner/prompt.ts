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
