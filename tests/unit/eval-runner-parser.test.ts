import { describe, expect, it } from "vitest";
import { parseReviewOutput } from "../eval/runner/parser";

const TRANSCRIPT = `## Component design & SRP
- [high] \`srp.props-cap\` Bad.tsx:13 — props 7 > 6
  problem: seven distinct data props
  fix: split into compound parts

## State & data
- [high] \`state.derived-effect\` ./UserList.tsx:30 — derived state in useEffect
  problem: fullName mirrored into state
  fix: compute during render
- [med] boundary/wrong-format should not match
`;

describe("parseReviewOutput", () => {
  it("parses id-bearing finding entries and normalises paths", () => {
    const result = parseReviewOutput(TRANSCRIPT);
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([
      { severity: "high", rule: "srp.props-cap", file: "Bad.tsx", line: 13 },
      { severity: "high", rule: "state.derived-effect", file: "UserList.tsx", line: 30 },
    ]);
  });

  it("accepts findings without backticks around the rule id", () => {
    const result = parseReviewOutput(
      "- [med] comp.config-soup Dialog.tsx:5 — boolean flags drive parts",
    );
    expect(result.ok).toBe(true);
    expect(result.findings[0]?.rule).toBe("comp.config-soup");
  });

  it("treats the NO_FINDINGS sentinel as a clean run", () => {
    const result = parseReviewOutput("NO_FINDINGS\n");
    expect(result).toEqual({ ok: true, findings: [] });
  });

  it("treats an explicit clean statement as a clean run", () => {
    const result = parseReviewOutput(
      "Both components comply with the standards — nothing to report.",
    );
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("marks output with neither findings nor a clean statement as failed", () => {
    const result = parseReviewOutput("I looked at the code and it seems fine I guess.");
    expect(result.ok).toBe(false);
    expect(result.findings).toEqual([]);
    expect(result.reason).toBeDefined();
  });

  it("skips malformed entries without crashing", () => {
    const result = parseReviewOutput(
      "- [high] missing-dot-id File.tsx:12 — no category prefix\n- [high] `srp.loc-cap` NoLine.tsx — missing line\nNO_FINDINGS",
    );
    expect(result.ok).toBe(true);
    expect(result.findings).toEqual([]);
  });
});
