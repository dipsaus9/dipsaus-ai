import { describe, expect, it } from "vitest";
import { majority, type Scorecard } from "../eval/metrics";

// Build a scorecard from a list of per-check pass booleans.
const card = (passes: boolean[]): Scorecard => ({
  total: passes.length,
  pass: passes.filter(Boolean).length,
  results: passes.map((pass, i) => ({
    standard: `s${i}`,
    severity: "med",
    desc: `check ${i}`,
    pass,
  })),
});

describe("majority()", () => {
  it("passes a check that passed in ≥ half of samples", () => {
    // check0 passes 2/3, check1 passes 1/3.
    const m = majority([card([true, false]), card([true, true]), card([false, false])]);
    expect(m.results.map((r) => r.pass)).toEqual([true, false]);
    expect(m.pass).toBe(1);
  });

  it("treats a tie (half) as a pass", () => {
    const m = majority([card([true]), card([false])]);
    expect(m.results[0]!.pass).toBe(true);
  });

  it("is a no-op for a single sample", () => {
    const m = majority([card([true, false, true])]);
    expect(m.results.map((r) => r.pass)).toEqual([true, false, true]);
    expect(m.pass).toBe(2);
  });

  it("collapses unanimous samples unchanged", () => {
    const m = majority([card([true, true]), card([true, true]), card([true, true])]);
    expect(m.pass).toBe(2);
  });

  it("throws on an empty sample set", () => {
    expect(() => majority([])).toThrow();
  });
});
