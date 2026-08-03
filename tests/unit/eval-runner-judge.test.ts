import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildJudgePrompt,
  judgeableRules,
  majorityVerdict,
  parseJudgeVote,
  readExemplar,
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

  // Regression: DIP-3.8 refresh, composition/variant-compound run 2 — the
  // judge deliberated, emitted an early fail, self-corrected, and the parser
  // recorded the draft instead of the final verdict.
  it("takes the final VERDICT when a deliberating judge self-corrects", () => {
    const parsed = parseJudgeVote(
      [
        "VERDICT: fail",
        "REASONING: Compound parts stay separate — `MetricCard.Kpi` and",
        "`MetricCard.Trend` exist as distinct components, no `variant` prop",
        "survives on the public API. Wait — check again: no god-part switch,",
        "no variant prop. Passes.",
        "",
        "VERDICT: pass",
        "REASONING: No `variant`/`kind` prop remains on the public API —",
        "separate compound parts, shared-shell extraction explicitly not",
        "required.",
      ].join("\n"),
    );
    expect(parsed.verdict).toBe("pass");
    expect(parsed.parsed).toBe(true);
    expect(parsed.reasoning).toContain("No `variant`/`kind` prop remains");
    expect(parsed.reasoning).not.toContain("Wait — check again");
  });

  it("keeps single-verdict output unchanged", () => {
    const parsed = parseJudgeVote("VERDICT: fail\nREASONING: showX flags survive.");
    expect(parsed).toEqual({
      verdict: "fail",
      reasoning: "showX flags survive.",
      parsed: true,
    });
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

describe("buildJudgePrompt with exemplar", () => {
  const rubric = readRubric("comp.config-soup");
  const files = { "Bad.tsx": "export function Dialog() { return null; }\n" };

  it("frames the exemplar as one acceptable shape, before the judged code", () => {
    const prompt = buildJudgePrompt(rubric, files, "export const GoodDialog = 1;\n");
    expect(prompt).toContain("REFERENCE — one acceptable target shape, NOT the only one");
    expect(prompt).toContain("export const GoodDialog = 1;");
    expect(prompt.indexOf("GoodDialog")).toBeLessThan(prompt.indexOf("export function Dialog()"));
  });

  it("omits the reference section entirely without an exemplar", () => {
    expect(buildJudgePrompt(rubric, files)).not.toContain("REFERENCE");
  });
});

describe("readExemplar", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function tmpFixtureDir(): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), "dipsaus-exemplar-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    return dir;
  }

  it("reads a single Good.tsx", () => {
    const dir = tmpFixtureDir();
    writeFileSync(path.join(dir, "Good.tsx"), "export const G = 1;\n");
    expect(readExemplar(dir)).toBe("export const G = 1;\n");
  });

  it("concatenates a Good/ directory in stable order", () => {
    const dir = tmpFixtureDir();
    mkdirSync(path.join(dir, "Good"));
    writeFileSync(path.join(dir, "Good", "B.tsx"), "export const B = 1;\n");
    writeFileSync(path.join(dir, "Good", "A.tsx"), "export const A = 1;\n");
    const exemplar = readExemplar(dir) ?? "";
    expect(exemplar).toContain("// Good/A.tsx");
    expect(exemplar.indexOf("A = 1")).toBeLessThan(exemplar.indexOf("B = 1"));
  });

  it("returns undefined when the fixture has no Good twin", () => {
    expect(readExemplar(tmpFixtureDir())).toBeUndefined();
  });
});
