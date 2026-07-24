import { describe, expect, it } from "vitest";
import { computeAbReport, mulberry32, shuffled } from "../eval/runner/ab";
import type { ApplyRunRecord } from "../eval/runner/apply";
import { buildControlSystemPrompt } from "../eval/runner/prompt";
import type { EvalReport, RuleScore } from "../eval/runner/types";

describe("buildControlSystemPrompt", () => {
  const prompt = buildControlSystemPrompt(["srp.loc-cap", "state.derived-effect"]);

  it("carries the shared format scaffolding and the id vocabulary", () => {
    expect(prompt).toContain("`<rule-id>` <file>:<line>");
    expect(prompt).toContain("`srp.loc-cap`");
    expect(prompt).toContain("NO_FINDINGS");
  });

  it("carries none of the skill's standards content", () => {
    for (const marker of ["150", "must fix", "compound API", "react-query", "Rule index", "severity: **high**"]) {
      expect(prompt).not.toContain(marker);
    }
    expect(prompt.toLowerCase()).not.toContain("skill");
  });
});

describe("shuffled", () => {
  const jobs = [
    { arm: "skill", id: 1 },
    { arm: "skill", id: 2 },
    { arm: "control", id: 3 },
    { arm: "control", id: 4 },
  ];

  it("is deterministic for a given seed", () => {
    expect(shuffled(jobs, 42)).toEqual(shuffled(jobs, 42));
  });

  it("permutes without losing or duplicating jobs", () => {
    const result = shuffled(jobs, 7);
    expect(result).toHaveLength(4);
    expect(new Set(result.map((j) => j.id)).size).toBe(4);
  });

  it("produces a usable PRNG in [0,1)", () => {
    const random = mulberry32(1);
    for (let i = 0; i < 100; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

function score(overrides: Partial<RuleScore>): RuleScore {
  return {
    rule: "srp.props-cap",
    severity: "high",
    fixture: "srp/props-cap",
    file: "Bad.tsx",
    model: "m1",
    detected: 5,
    runs: 5,
    ...overrides,
  };
}

function report(scores: RuleScore[], fps: EvalReport["falsePositives"] = []): EvalReport {
  return {
    config: { models: ["m1"], runs: 5, thresholds: { high: 1, medLow: 0.8 } },
    scores,
    falsePositives: fps,
    failedRuns: [],
    verdict: { pass: true, failures: [] },
  };
}

function applyRun(pass: boolean, fixture = "composition/config-soup"): ApplyRunRecord {
  return {
    fixture,
    model: "m1",
    run: 1,
    pass,
    checks: { originalsUntouched: true, caps: true, banned: true, tsc: true, behaviorTests: pass },
    detail: [],
  };
}

describe("computeAbReport", () => {
  it("computes per-category deltas and calls out where the skill helps or hurts", () => {
    const skillArm = {
      review: report(
        [score({ detected: 5 }), score({ fixture: "state/colocate", rule: "state.colocate", detected: 5 })],
      ),
      apply: report([]),
      applyRuns: [applyRun(true), applyRun(true)],
    };
    const controlArm = {
      review: report(
        [score({ detected: 2 }), score({ fixture: "state/colocate", rule: "state.colocate", detected: 5 })],
        [{ fixture: "state/colocate", model: "m1", run: 1, file: "Good.tsx", rule: "state.colocate", line: 3 }],
      ),
      apply: report([]),
      applyRuns: [applyRun(false), applyRun(true)],
    };
    const ab = computeAbReport(["m1"], skillArm, controlArm);

    const srp = ab.deltas.find((d) => d.category === "srp");
    expect(srp?.skill.detectionRate).toBe(1);
    expect(srp?.control.detectionRate).toBe(0.4);
    expect(ab.summary.some((line) => line.includes("srp") && line.includes("improves detection"))).toBe(true);
    expect(ab.summary.some((line) => line.includes("state") && line.includes("no detection signal"))).toBe(true);
    expect(ab.summary.some((line) => line.includes("false positives 0 (skill) vs 1 (control)"))).toBe(true);
    expect(
      ab.summary.some((line) => line.includes("apply pass rate 50% (control) -> 100% (skill)")),
    ).toBe(true);
  });

  it("keeps the A/B report a distinct kind, never baseline-shaped", () => {
    const arm = { review: report([score({})]), apply: report([]), applyRuns: [] };
    const ab = computeAbReport(["m1"], arm, arm);
    expect(ab.kind).toBe("ab-comparison");
  });
});
