import { describe, expect, it } from "vitest";
import { aggregate, fileMatches, matchRun } from "../eval/runner/matcher";
import type { Finding, FixtureLabels, RunRecord } from "../eval/runner/types";

const LABELS: FixtureLabels = {
  files: {
    "Bad.tsx": {
      expected: [{ rule: "srp.props-cap", line: 13 }],
      alsoAcceptable: ["comp.config-soup"],
    },
    "Good.tsx": { expected: [], alsoAcceptable: [] },
  },
};

function finding(rule: string, file: string, line: number): Finding {
  return { severity: "high", rule, file, line };
}

describe("fileMatches", () => {
  it("matches bare names, fixture-relative and longer paths", () => {
    expect(fileMatches("Bad.tsx", "Bad.tsx")).toBe(true);
    expect(fileMatches("srp/props-cap/Bad.tsx", "Bad.tsx")).toBe(true);
    expect(fileMatches("index.ts", "billing/index.ts")).toBe(true);
    expect(fileMatches("Good.tsx", "Bad.tsx")).toBe(false);
  });
});

describe("matchRun", () => {
  it("detects on rule + file regardless of the reported line", () => {
    const match = matchRun([finding("srp.props-cap", "Bad.tsx", 3)], LABELS);
    expect(match.detected).toEqual([
      { file: "Bad.tsx", expected: { rule: "srp.props-cap", line: 13 }, hit: true },
    ]);
    expect(match.falsePositives).toEqual([]);
  });

  it("treats duplicates of a claimed rule as noise, not false positives", () => {
    const match = matchRun(
      [finding("srp.props-cap", "Bad.tsx", 13), finding("srp.props-cap", "Bad.tsx", 3)],
      LABELS,
    );
    expect(match.detected[0]?.hit).toBe(true);
    expect(match.falsePositives).toEqual([]);
  });

  it("ignores alsoAcceptable findings entirely", () => {
    const match = matchRun([finding("comp.config-soup", "Bad.tsx", 40)], LABELS);
    expect(match.detected[0]?.hit).toBe(false);
    expect(match.falsePositives).toEqual([]);
  });

  it("still flags a wrong rule on a bad file as a false positive", () => {
    const match = matchRun([finding("state.colocate", "Bad.tsx", 13)], LABELS);
    expect(match.detected[0]?.hit).toBe(false);
    expect(match.falsePositives).toHaveLength(1);
  });

  it("flags findings on clean twins and unknown files as false positives", () => {
    const match = matchRun(
      [finding("srp.loc-cap", "Good.tsx", 8), finding("srp.loc-cap", "Elsewhere.tsx", 1)],
      LABELS,
    );
    expect(match.falsePositives).toHaveLength(2);
  });
});

function record(
  run: number,
  findings: Finding[],
  overrides: Partial<RunRecord> = {},
): RunRecord {
  return {
    fixture: "srp/props-cap",
    model: "claude-sonnet-5",
    run,
    ok: true,
    findings,
    raw: "",
    ...overrides,
  };
}

const AGG_CONFIG = {
  thresholds: { high: 1, medLow: 0.8 },
  models: ["claude-sonnet-5"],
  runs: 5,
};

describe("aggregate", () => {
  const labelsByFixture = new Map([["srp/props-cap", LABELS]]);
  const hit = [finding("srp.props-cap", "Bad.tsx", 13)];

  it("passes when a high rule is detected in every run", () => {
    const records = [1, 2, 3, 4, 5].map((n) => record(n, hit));
    const report = aggregate(records, labelsByFixture, AGG_CONFIG);
    expect(report.scores).toEqual([
      expect.objectContaining({ rule: "srp.props-cap", detected: 5, runs: 5 }),
    ]);
    expect(report.verdict.pass).toBe(true);
  });

  it("fails a high rule at 4/5 — including when the miss is a failed run", () => {
    const records = [
      ...[1, 2, 3, 4].map((n) => record(n, hit)),
      record(5, [], { ok: false, error: "unparseable output" }),
    ];
    const report = aggregate(records, labelsByFixture, AGG_CONFIG);
    expect(report.failedRuns).toHaveLength(1);
    expect(report.verdict.pass).toBe(false);
    expect(report.verdict.failures[0]?.kind).toBe("detection");
  });

  it("passes a med rule at 4/5", () => {
    const medLabels: FixtureLabels = {
      files: { "Bad.tsx": { expected: [{ rule: "state.colocate", line: 30 }] } },
    };
    const byFixture = new Map([["state/colocate", medLabels]]);
    const records = [1, 2, 3, 4].map((n) =>
      record(n, [finding("state.colocate", "Bad.tsx", 30)], { fixture: "state/colocate" }),
    );
    records.push(record(5, [], { fixture: "state/colocate" }));
    const report = aggregate(records, byFixture, AGG_CONFIG);
    expect(report.verdict.pass).toBe(true);
    expect(report.scores[0]).toEqual(
      expect.objectContaining({ severity: "med", detected: 4, runs: 5 }),
    );
  });

  it("fails the verdict when a good twin is flagged in any run", () => {
    const records = [
      record(1, [...hit, finding("srp.loc-cap", "Good.tsx", 3)]),
      ...[2, 3, 4, 5].map((n) => record(n, hit)),
    ];
    const report = aggregate(records, labelsByFixture, AGG_CONFIG);
    expect(report.falsePositives).toHaveLength(1);
    expect(report.verdict.pass).toBe(false);
    expect(report.verdict.failures[0]?.kind).toBe("false-positive");
  });

  it("reports false positives on bad files without failing the verdict", () => {
    const records = [1, 2, 3, 4, 5].map((n) =>
      record(n, [...hit, finding("state.derived-effect", "Bad.tsx", 90)]),
    );
    const report = aggregate(records, labelsByFixture, AGG_CONFIG);
    expect(report.falsePositives).toHaveLength(5);
    expect(report.verdict.pass).toBe(true);
  });
});
