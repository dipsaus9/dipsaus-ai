import { describe, expect, it } from "vitest";
import {
  deliverDiffPasses,
  diffDeliverBaseline,
  toDeliverBaseline,
  type DeliverBaseline,
  type DeliverCaseRecord,
} from "../eval/runner/deliver";

function record(fixture: string, deterministicPass: boolean, judged: boolean, qualityPass = true): DeliverCaseRecord {
  return {
    fixture,
    scorecard: {
      branch: { pass: deterministicPass, detail: "" },
      verify: { pass: deterministicPass, detail: "" },
      acs: { pass: deterministicPass, detail: "" },
      scope: { pass: deterministicPass, detail: "" },
      review: { pass: deterministicPass, detail: "" },
      pass: deterministicPass,
    },
    judge: judged
      ? { judged: true, verdict: { rule: "deliver-quality", pass: qualityPass, votes: [], unanimous: true, majorityReasoning: [] } }
      : { judged: false, reason: "gate failed" },
  };
}

describe("toDeliverBaseline", () => {
  it("captures deterministic pass and the quality verdict", () => {
    const base = toDeliverBaseline([record("a", true, true, true), record("b", false, false)]);
    expect(base.a).toEqual({ deterministicPass: true, quality: "pass" });
    expect(base.b).toEqual({ deterministicPass: false, quality: "skipped" });
  });

  it("records a judged fail and treats an errored case as deterministic fail / skipped quality", () => {
    const base = toDeliverBaseline([record("a", true, true, false), { fixture: "err", error: "boom" }]);
    expect(base.a?.quality).toBe("fail");
    expect(base.err).toEqual({ deterministicPass: false, quality: "skipped" });
  });
});

describe("diffDeliverBaseline", () => {
  const committed: DeliverBaseline = {
    keep: { deterministicPass: true, quality: "pass" },
    breaks: { deterministicPass: true, quality: "pass" },
    fixes: { deterministicPass: false, quality: "skipped" },
    gone: { deterministicPass: true, quality: "pass" },
  };
  const current: DeliverBaseline = {
    keep: { deterministicPass: true, quality: "pass" },
    breaks: { deterministicPass: false, quality: "skipped" },
    fixes: { deterministicPass: true, quality: "pass" },
    fresh: { deterministicPass: true, quality: "pass" },
  };

  it("classifies regressions, improvements, added and removed", () => {
    const diff = diffDeliverBaseline(committed, current);
    expect(diff.regressions).toEqual(["breaks"]);
    expect(diff.improvements).toEqual(["fixes"]);
    expect(diff.added).toEqual(["fresh"]);
    expect(diff.removed).toEqual(["gone"]);
  });

  it("fails the diff only when something regressed", () => {
    expect(deliverDiffPasses(diffDeliverBaseline(committed, current))).toBe(false);
    expect(deliverDiffPasses(diffDeliverBaseline(committed, committed))).toBe(true);
  });
});
