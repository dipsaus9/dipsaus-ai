import { describe, expect, it } from "vitest";
import {
  buildDeliverJudgePrompt,
  judgeDelivery,
  type DeliverJudgeInput,
} from "../eval/runner/deliver-judge";
import { defaultConfig } from "../eval/runner/config";

const INPUT: DeliverJudgeInput = {
  storyOutcome: "Add sum(a, b) so the test passes.",
  acs: ["src/sum.js exports sum(a, b)", "the test suite passes"],
  diff: "+++ src/sum.js\n+export function sum(a, b) { return a + b }",
};

describe("buildDeliverJudgePrompt", () => {
  it("includes the rubric, story outcome, numbered ACs and the diff", () => {
    const prompt = buildDeliverJudgePrompt("RUBRIC-BODY", INPUT);
    expect(prompt).toContain("RUBRIC-BODY");
    expect(prompt).toContain("Add sum(a, b)");
    expect(prompt).toContain("1. src/sum.js exports sum(a, b)");
    expect(prompt).toContain("2. the test suite passes");
    expect(prompt).toContain("export function sum");
  });

  it("asks for the VERDICT/REASONING format parseJudgeVote expects", () => {
    const prompt = buildDeliverJudgePrompt("R", INPUT);
    expect(prompt).toContain("VERDICT: pass|fail");
    expect(prompt).toContain("REASONING:");
  });
});

describe("judgeDelivery gate (AC#2)", () => {
  it("skips the judge — and makes no model call — when the deterministic gate failed", async () => {
    const result = await judgeDelivery({
      config: defaultConfig,
      input: INPUT,
      deterministicPass: false,
    });
    expect(result.judged).toBe(false);
    if (!result.judged) expect(result.reason).toContain("deterministic gate failed");
  });
});
