import type { Finding, ParseResult, Severity } from "./types";

/**
 * One finding entry in the skill's review-mode output:
 *   - [high] `srp.props-cap` Card.tsx:12 — props 9 > 6
 * Backticks around the rule id are optional; the em-dash may be a hyphen.
 */
const FINDING_RE =
  /^[-*]\s*\[(high|med|low)\]\s*`?([a-z]+\.[a-z0-9-]+)`?\s+(\S+?):(\d+)(?:\s*(?:[—–-]|$))/;

const NO_FINDINGS_RE =
  /NO_FINDINGS|no findings|no violations|nothing violates|nothing to report|complies with the standards/i;

export function parseReviewOutput(raw: string): ParseResult {
  const findings: Finding[] = [];
  for (const rawLine of raw.split("\n")) {
    const match = FINDING_RE.exec(rawLine.trim());
    if (!match) {
      continue;
    }
    const [, severity, rule, file, line] = match;
    if (severity === undefined || rule === undefined || file === undefined || line === undefined) {
      continue;
    }
    findings.push({
      severity: severity as Severity,
      rule,
      file: file.replace(/^\.\//, ""),
      line: Number(line),
    });
  }
  if (findings.length > 0) {
    return { ok: true, findings };
  }
  if (NO_FINDINGS_RE.test(raw)) {
    return { ok: true, findings: [] };
  }
  return { ok: false, findings: [], reason: "no findings and no explicit clean statement" };
}
