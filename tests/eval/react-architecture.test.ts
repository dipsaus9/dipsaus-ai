import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { refactor } from "./apply";
import { score, type Scorecard } from "./metrics";
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

// Allow a single run-to-run miss: one LLM refactor varies, so demanding a perfect score
// every run would flake. The skill must still meet all-but-one of the standard's checks.
const allowedMisses = 1;

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

      const skill = score(refactor(c.file, "skill"), c.file);
      const baseline = score(refactor(c.file, "baseline"), c.file);
      report(c.file, skill, baseline);

      const required = skill.total - allowedMisses;
      const missed = skill.results.filter((r) => !r.pass).map((r) => `[${r.severity}] ${r.desc}`);
      expect(
        skill.pass,
        `skill met ${skill.pass}/${skill.total} of the standard (need ≥ ${required}). Unmet: ${missed.join("; ")}`,
      ).toBeGreaterThanOrEqual(required);
    }, 600_000);
  }
});
