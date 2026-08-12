import { describe, expect, it } from "vitest";
import {
  fileInScope,
  gradeDeliverRun,
  scopeViolations,
  type DeliverExpected,
  type DeliverRunResult,
} from "../eval/runner/deliver-grade";

const EXPECTED: DeliverExpected = {
  branch: "DIP-1.1/feature",
  acs: [1, 2],
  references: ["src/feature/", "package.json"],
  reviewEnabled: true,
};

function run(over: Partial<DeliverRunResult>): DeliverRunResult {
  return {
    branch: "DIP-1.1/feature",
    verifyGreen: true,
    checkedAcs: [1, 2],
    modifiedFiles: ["src/feature/index.ts", "package.json"],
    reviewerVerdict: "pass",
    ...over,
  };
}

describe("scope helpers", () => {
  it("a file under a declared directory Reference is in scope", () => {
    expect(fileInScope("src/feature/index.ts", ["src/feature/"])).toBe(true);
    expect(fileInScope("package.json", ["package.json"])).toBe(true);
  });

  it("a file outside every Reference is not in scope (segment prefix, not raw string)", () => {
    expect(fileInScope("src/feature-2/x.ts", ["src/feature/"])).toBe(false);
    expect(scopeViolations(["src/feature/a.ts", "src/other/b.ts"], ["src/feature/"])).toEqual([
      "src/other/b.ts",
    ]);
  });
});

describe("gradeDeliverRun", () => {
  it("passes when every dimension matches", () => {
    const card = gradeDeliverRun(run({}), EXPECTED);
    expect(card.pass).toBe(true);
  });

  it("fails the branch dimension on a wrong branch", () => {
    const card = gradeDeliverRun(run({ branch: "DIP-1.1/wrong" }), EXPECTED);
    expect(card.branch.pass).toBe(false);
    expect(card.pass).toBe(false);
  });

  it("fails verify when not green", () => {
    expect(gradeDeliverRun(run({ verifyGreen: false }), EXPECTED).verify.pass).toBe(false);
  });

  it("fails ACs when one expected criterion is unchecked", () => {
    const card = gradeDeliverRun(run({ checkedAcs: [1] }), EXPECTED);
    expect(card.acs.pass).toBe(false);
    expect(card.acs.detail).toContain("2");
  });

  it("fails scope when a file outside References was touched", () => {
    const card = gradeDeliverRun(run({ modifiedFiles: ["src/feature/x.ts", "README.md"] }), EXPECTED);
    expect(card.scope.pass).toBe(false);
    expect(card.scope.detail).toContain("README.md");
  });

  it("fails review on a block verdict", () => {
    expect(gradeDeliverRun(run({ reviewerVerdict: "block" }), EXPECTED).review.pass).toBe(false);
  });

  it("treats review as n/a (pass) when the fixture disabled it", () => {
    const exp = { ...EXPECTED, reviewEnabled: false };
    const card = gradeDeliverRun(run({ reviewerVerdict: null }), exp);
    expect(card.review.pass).toBe(true);
    expect(card.pass).toBe(true);
  });
});
