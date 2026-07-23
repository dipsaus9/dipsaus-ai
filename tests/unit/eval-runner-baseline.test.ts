import { describe, expect, it } from "vitest";
import {
  diffBaseline,
  diffPasses,
  mergeBaseline,
  toBaseline,
  type Baseline,
  type BaselineEntry,
} from "../eval/runner/baseline";
import type { RuleScore } from "../eval/runner/types";

function entry(overrides: Partial<BaselineEntry>): BaselineEntry {
  return {
    rule: "srp.props-cap",
    fixture: "srp/props-cap",
    file: "Bad.tsx",
    model: "claude-sonnet-5",
    detected: 5,
    runs: 5,
    ...overrides,
  };
}

function baseline(...entries: BaselineEntry[]): Baseline {
  return { kind: "review-baseline", entries };
}

describe("toBaseline", () => {
  it("produces a canonical sorted body without timestamps", () => {
    const scores: RuleScore[] = [
      { rule: "z.rule", severity: "med", fixture: "b/fix", file: "Bad.tsx", model: "m", detected: 4, runs: 5 },
      { rule: "a.rule", severity: "high", fixture: "a/fix", file: "Bad.tsx", model: "m", detected: 5, runs: 5 },
    ];
    const result = toBaseline(scores);
    expect(Object.keys(result)).toEqual(["kind", "entries"]);
    expect(result.entries.map((e) => e.rule)).toEqual(["a.rule", "z.rule"]);
    expect(result.entries[0]).toEqual({
      rule: "a.rule",
      fixture: "a/fix",
      file: "Bad.tsx",
      model: "m",
      detected: 5,
      runs: 5,
    });
  });
});

describe("diffBaseline", () => {
  it("names a rate drop as a regression with old and new counts", () => {
    const diff = diffBaseline(
      baseline(entry({ detected: 5 })),
      baseline(entry({ detected: 3 })),
    );
    expect(diff.regressions).toHaveLength(1);
    expect(diff.regressions[0]?.detail).toBe(
      "srp.props-cap on srp/props-cap/Bad.tsx @ claude-sonnet-5: 5/5 -> 3/5",
    );
    expect(diffPasses(diff)).toBe(false);
  });

  it("treats an improvement as passing", () => {
    const diff = diffBaseline(
      baseline(entry({ detected: 4 })),
      baseline(entry({ detected: 5 })),
    );
    expect(diff.regressions).toEqual([]);
    expect(diffPasses(diff)).toBe(true);
  });

  it("reports new entries as additions, not regressions", () => {
    const diff = diffBaseline(
      baseline(entry({})),
      baseline(entry({}), entry({ rule: "state.colocate", fixture: "state/colocate" })),
    );
    expect(diff.regressions).toEqual([]);
    expect(diff.additions).toHaveLength(1);
    expect(diff.additions[0]).toContain("state.colocate");
    expect(diffPasses(diff)).toBe(true);
  });

  it("flags an in-scope removed entry for explicit refresh", () => {
    const diff = diffBaseline(
      baseline(entry({}), entry({ rule: "comp.config-soup" })),
      baseline(entry({})),
    );
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]?.detail).toContain("--update-baseline");
    expect(diffPasses(diff)).toBe(false);
  });

  it("ignores baseline entries outside the run's model/fixture scope", () => {
    const diff = diffBaseline(
      baseline(
        entry({}),
        entry({ model: "claude-haiku-4-5-20251001" }),
        entry({ fixture: "state/colocate", file: "Bad.tsx", rule: "state.colocate" }),
      ),
      baseline(entry({})),
    );
    expect(diff.removed).toEqual([]);
    expect(diff.outOfScope).toBe(2);
    expect(diffPasses(diff)).toBe(true);
  });

  it("compares differing K as proportions but flags the mismatch", () => {
    const diff = diffBaseline(
      baseline(entry({ detected: 4, runs: 5 })),
      baseline(entry({ detected: 8, runs: 10 })),
    );
    expect(diff.regressions).toEqual([]);
    expect(diff.kMismatches).toHaveLength(1);
    const drop = diffBaseline(
      baseline(entry({ detected: 5, runs: 5 })),
      baseline(entry({ detected: 9, runs: 10 })),
    );
    expect(drop.regressions).toHaveLength(1);
  });
});

describe("mergeBaseline", () => {
  it("replaces in-scope entries and keeps the rest on a filtered update", () => {
    const existing = baseline(
      entry({ detected: 5 }),
      entry({ fixture: "state/colocate", rule: "state.colocate", detected: 4 }),
    );
    const filteredRun = baseline(entry({ detected: 3 }));
    const merged = mergeBaseline(existing, filteredRun);
    expect(merged.entries).toHaveLength(2);
    expect(
      merged.entries.find((e) => e.fixture === "srp/props-cap")?.detected,
    ).toBe(3);
    expect(
      merged.entries.find((e) => e.fixture === "state/colocate")?.detected,
    ).toBe(4);
  });

  it("returns the current run as-is when no baseline exists", () => {
    const current = baseline(entry({}));
    expect(mergeBaseline(null, current)).toEqual(current);
  });
});
