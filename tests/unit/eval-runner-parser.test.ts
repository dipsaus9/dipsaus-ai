import { describe, expect, it } from "vitest";
import { aggregate } from "../eval/runner/matcher";
import { parseReviewOutput } from "../eval/runner/parser";
import { buildUserPrompt, splitReviewCalls } from "../eval/runner/prompt";
import type { FixtureCase, FixtureLabels } from "../eval/runner/types";

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

function fixtureCase(sources: Record<string, string>): FixtureCase {
  return { name: "srp/example", dir: "/tmp/example", labels: { files: {} }, sources };
}

describe("splitReviewCalls", () => {
  it("never places the Good twin in the same call as Bad", () => {
    const calls = splitReviewCalls(
      fixtureCase({ "Bad.tsx": "bad", "Demo.tsx": "demo", "Good.tsx": "good" }),
    );
    expect(calls.map((call) => call.kind)).toEqual(["detection", "precision"]);
    expect(Object.keys(calls[0]?.sources ?? {})).toEqual(["Bad.tsx", "Demo.tsx"]);
    expect(Object.keys(calls[1]?.sources ?? {})).toEqual(["Good.tsx"]);
  });

  it("keeps a single call for fixtures without a Good twin", () => {
    const calls = splitReviewCalls(fixtureCase({ "Bad.tsx": "bad", "Demo.tsx": "demo" }));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.kind).toBe("detection");
    expect(Object.keys(calls[0]?.sources ?? {})).toEqual(["Bad.tsx", "Demo.tsx"]);
  });

  it("routes files under a Good/ directory to the precision call", () => {
    const calls = splitReviewCalls(
      fixtureCase({ "Bad.tsx": "bad", "Good/Panel.tsx": "good part" }),
    );
    expect(Object.keys(calls[0]?.sources ?? {})).toEqual(["Bad.tsx"]);
    expect(Object.keys(calls[1]?.sources ?? {})).toEqual(["Good/Panel.tsx"]);
  });

  it("keeps support files with the detection call", () => {
    const calls = splitReviewCalls(
      fixtureCase({ "Bad.tsx": "bad", "billing/index.ts": "export const fmt = 1;", "Good.tsx": "good" }),
    );
    expect(Object.keys(calls[0]?.sources ?? {})).toEqual(["Bad.tsx", "billing/index.ts"]);
  });
});

describe("buildUserPrompt", () => {
  it("contains exactly the files it is given", () => {
    const prompt = buildUserPrompt({ "Bad.tsx": "const bad = 1;\n" });
    expect(prompt).toContain("### File: Bad.tsx");
    expect(prompt).toContain("const bad = 1;");
    expect(prompt).not.toContain("Good.tsx");
  });
});

describe("aggregate over merged split-call records", () => {
  const labels: FixtureLabels = {
    files: {
      "Bad.tsx": { expected: [{ rule: "srp.props-cap", line: 3 }] },
      "Good.tsx": { expected: [] },
    },
  };
  const labelsByFixture = new Map([["srp/example", labels]]);
  const config = { thresholds: { high: 1, medLow: 0.8 }, models: ["m"], runs: 1 };

  it("attributes detection to Bad and false positives to Good with one record per run", () => {
    const report = aggregate(
      [
        {
          fixture: "srp/example",
          model: "m",
          run: 1,
          ok: true,
          findings: [
            { severity: "high" as const, rule: "srp.props-cap", file: "Bad.tsx", line: 3 },
            { severity: "med" as const, rule: "comp.config-soup", file: "Good.tsx", line: 8 },
          ],
          raw: "",
        },
      ],
      labelsByFixture,
      config,
    );
    const score = report.scores.find((s) => s.rule === "srp.props-cap");
    expect(score).toMatchObject({ file: "Bad.tsx", detected: 1, runs: 1 });
    expect(report.falsePositives).toHaveLength(1);
    expect(report.falsePositives[0]).toMatchObject({ file: "Good.tsx", rule: "comp.config-soup" });
    expect(report.verdict.failures.some((f) => f.kind === "false-positive")).toBe(true);
  });
});
