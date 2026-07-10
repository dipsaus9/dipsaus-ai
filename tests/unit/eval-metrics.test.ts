import { describe, expect, it } from "vitest";
import { summarize } from "../eval/metrics";

// Pure A/B math behind the eval benchmark — deterministic, no LLM calls.
describe("summarize()", () => {
  it("computes means, delta and win-rate from paired samples", () => {
    // skill: 4,4,3  baseline: 2,4,2  → wins 2, tie 1 → win-rate (2 + 0.5)/3
    const b = summarize([4, 4, 3], [2, 4, 2], 4);
    expect(b.n).toBe(3);
    expect(b.skillMean).toBeCloseTo(11 / 3);
    expect(b.baselineMean).toBeCloseTo(8 / 3);
    expect(b.delta).toBeCloseTo(1);
    expect(b.winRate).toBeCloseTo(2.5 / 3);
  });

  it("reports a 50% win-rate when skill and baseline always tie", () => {
    const b = summarize([3, 3], [3, 3], 4);
    expect(b.winRate).toBe(0.5);
    expect(b.delta).toBe(0);
  });

  it("reports 100% when skill always wins", () => {
    expect(summarize([4, 4], [1, 2], 4).winRate).toBe(1);
  });

  it("uses the shorter length when sample counts differ", () => {
    const b = summarize([4, 4, 4], [1, 1], 4);
    expect(b.n).toBe(2);
    expect(b.winRate).toBe(1);
  });

  it("handles empty input without dividing by zero", () => {
    const b = summarize([], [], 4);
    expect(b.n).toBe(0);
    expect(b.winRate).toBe(0);
    expect(b.skillMean).toBe(0);
  });
});
