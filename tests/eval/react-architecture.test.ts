import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { refactor } from "./apply";
import { majority, score, type Scorecard } from "./metrics";
import { evalUsage, evalUsageSummary, isCliReady, resetEvalUsage } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

// For each fixture we refactor twice — once with the skill, once with a no-skill baseline —
// and score BOTH against the detailed, standard-by-standard checks in metrics.ts. The score
// says how much of the react-architecture standard each refactor actually met. The gate is
// that the SKILL meets the standard; the baseline is logged alongside so the skill's
// contribution is visible without asserting a fragile "skill > baseline".
const CASES: { file: string; label: string }[] = [
  { file: "fixtures/react/prop-drilling.tsx", label: "prop drilling" },
  { file: "fixtures/react/cross-feature-coupling.tsx", label: "feature boundaries" },
  { file: "fixtures/react/config-soup-card.tsx", label: "compound components" },
  { file: "fixtures/react/god-component.tsx", label: "SRP + state/data" },
];

// Allow a single miss: even after majority voting a genuinely ~50/50 check can fall either
// way, so the skill must meet all-but-one of the standard's checks.
const allowedMisses = 1;

// De-flake by sampling: the skill is refactored EVAL_SAMPLES times (default 3) and the
// score is the per-check majority vote — stable where a single run is a coin-flip. The
// baseline is a single reference run (it is reported, not gated). EVAL_SAMPLES=1 → fast
// but flaky; raise it for a trustworthy result.
const SAMPLES = Math.max(1, Math.trunc(Number(process.env.EVAL_SAMPLES ?? 3)) || 1);

let ready = false;
beforeAll(() => {
  resetEvalUsage();
  ready = isCliReady(repoRoot);
}, 120_000);

// Always surface what the (billed, slow) run cost, even if a case failed.
afterAll(() => {
  if (evalUsage.calls > 0) console.log(evalUsageSummary());
});

const mark = (r: boolean): string => (r ? "✓" : "✗");

function report(file: string, skill: Scorecard, baseline: Scorecard): void {
  console.log(`[eval] ${file}  skill=${skill.pass}/${skill.total}  baseline=${baseline.pass}/${baseline.total}`);
  for (let i = 0; i < skill.results.length; i++) {
    const s = skill.results[i]!;
    const b = baseline.results[i]!;
    console.log(`  skill ${mark(s.pass)} | base ${mark(b.pass)}  [${s.severity}] ${s.desc}`);
  }
}

describe("react-architecture apply-mode eval (scored against the standard)", () => {
  for (const c of CASES) {
    it(`skill meets the standard: ${c.label}`, (ctx) => {
      if (!ready) return ctx.skip();

      const samples: Scorecard[] = [];
      for (let i = 0; i < SAMPLES; i++) {
        const sc = score(refactor(c.file, "skill"), c.file);
        samples.push(sc);
        if (SAMPLES > 1) console.log(`  [skill sample ${i + 1}/${SAMPLES}] ${sc.pass}/${sc.total}`);
      }
      const skill = majority(samples);
      const baseline = score(refactor(c.file, "baseline"), c.file);
      report(c.file, skill, baseline);

      const required = skill.total - allowedMisses;
      const missed = skill.results.filter((r) => !r.pass).map((r) => `[${r.severity}] ${r.desc}`);
      expect(
        skill.pass,
        `skill met ${skill.pass}/${skill.total} of the standard by majority of ${SAMPLES} (need ≥ ${required}). Unmet: ${missed.join("; ")}`,
      ).toBeGreaterThanOrEqual(required);
    }, (SAMPLES + 1) * 220_000);
  }
});
