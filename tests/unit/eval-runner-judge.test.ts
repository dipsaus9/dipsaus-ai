import { describe, expect, it } from "vitest";
import {
  buildJudgePrompt,
  judgeableRules,
  majorityVerdict,
  parseJudgeVote,
  readRubric,
  type JudgeVote,
} from "../eval/runner/judge";

function vote(verdict: "pass" | "fail", reasoning = "because"): JudgeVote {
  return { verdict, reasoning, parsed: true };
}

describe("parseJudgeVote", () => {
  it("parses a clean pass vote with reasoning", () => {
    const parsed = parseJudgeVote(
      "VERDICT: pass\nREASONING: Regions are compound parts; no config props remain.",
    );
    expect(parsed).toEqual({
      verdict: "pass",
      reasoning: "Regions are compound parts; no config props remain.",
      parsed: true,
    });
  });

  it("parses a fail vote case-insensitively", () => {
    expect(parseJudgeVote("verdict: FAIL\nreasoning: showX flags survive.").verdict).toBe("fail");
  });

  it("falls back to a recorded fail on unparseable output", () => {
    const parsed = parseJudgeVote("I think this looks pretty good overall!");
    expect(parsed.verdict).toBe("fail");
    expect(parsed.parsed).toBe(false);
    expect(parsed.reasoning).toContain("unparseable");
  });
});

describe("majorityVerdict", () => {
  it("passes 3-0 unanimously", () => {
    const verdict = majorityVerdict("comp.config-soup", [vote("pass"), vote("pass"), vote("pass")]);
    expect(verdict.pass).toBe(true);
    expect(verdict.unanimous).toBe(true);
  });

  it("passes 2-1 but flags non-unanimity", () => {
    const verdict = majorityVerdict("comp.config-soup", [
      vote("pass", "a"),
      vote("fail", "b"),
      vote("pass", "c"),
    ]);
    expect(verdict.pass).toBe(true);
    expect(verdict.unanimous).toBe(false);
    expect(verdict.majorityReasoning).toEqual(["a", "c"]);
  });

  it("fails 1-2 with the failing majority's reasoning", () => {
    const verdict = majorityVerdict("comp.regions-as-slots", [
      vote("pass", "a"),
      vote("fail", "b"),
      vote("fail", "c"),
    ]);
    expect(verdict.pass).toBe(false);
    expect(verdict.majorityReasoning).toEqual(["b", "c"]);
  });

  it("treats unparseable fail-safe votes as fail votes", () => {
    const garbled: JudgeVote = { verdict: "fail", reasoning: "unparseable", parsed: false };
    const verdict = majorityVerdict("comp.config-soup", [vote("pass"), garbled, garbled]);
    expect(verdict.pass).toBe(false);
  });
});

describe("buildJudgePrompt blindness", () => {
  const rubric = readRubric("comp.config-soup");
  const prompt = buildJudgePrompt(rubric, {
    "Bad.tsx": "export function Dialog() { return null; }\n",
  });

  it("contains the rubric and the code", () => {
    expect(prompt).toContain("Rubric: comp.config-soup");
    expect(prompt).toContain("export function Dialog()");
    expect(prompt).toContain("VERDICT: pass|fail");
  });

  it("carries no run metadata — no model ids, skill arms, or fixture labels", () => {
    for (const leak of ["claude-", "skill", "baseline", "expected.json", "fixture"]) {
      expect(prompt.toLowerCase()).not.toContain(leak);
    }
  });
});

describe("judgeableRules", () => {
  it("keeps only rules with a rubric on disk", () => {
    expect(
      judgeableRules(["comp.config-soup", "srp.props-cap", "comp.variant-compound"]),
    ).toEqual(["comp.config-soup", "comp.variant-compound"]);
  });
});
