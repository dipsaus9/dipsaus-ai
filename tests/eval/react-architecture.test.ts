import { appendFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { refactor } from "./apply";
import { score, summarize, type Benchmark } from "./metrics";
import { evalUsage, evalUsageSummary, isCliReady, resetEvalUsage } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const resultsLog = fileURLToPath(new URL("./results.jsonl", import.meta.url));
const skillPath = fileURLToPath(new URL("../../skills/react-architecture/SKILL.md", import.meta.url));

// A hard pass/fail gate on one stochastic LLM refactor cannot be non-flaky: near the
// threshold, ordinary run-to-run variance flips red/green. So this is NOT a gate — it is a
// MEASUREMENT. Per fixture we refactor skill vs baseline in paired samples, score both
// against the detailed standard checks, and report how much the skill beats the baseline
// (win-rate + mean score delta). Results append to results.jsonl keyed by a SKILL.md hash,
// so you watch the numbers move as you edit the skill. The only assertion is structural
// (did the run produce data) — there is no quality cliff to flake.
const CASES: { file: string; label: string }[] = [
  { file: "fixtures/react/prop-drilling.tsx", label: "prop drilling" },
  { file: "fixtures/react/cross-feature-coupling.tsx", label: "feature boundaries" },
  { file: "fixtures/react/config-soup-card.tsx", label: "compound components" },
  { file: "fixtures/react/god-component.tsx", label: "SRP + state/data" },
];

// Paired samples per fixture. More samples → tighter win-rate estimate. Default 3.
const SAMPLES = Math.max(1, Math.trunc(Number(process.env.EVAL_SAMPLES ?? 3)) || 1);

let ready = false;
let skillHash = "unknown";
const collected: { file: string; label: string; bench: Benchmark }[] = [];

beforeAll(() => {
  resetEvalUsage();
  skillHash = createHash("sha256").update(readFileSync(skillPath)).digest("hex").slice(0, 12);
  ready = isCliReady(repoRoot);
}, 120_000);

afterAll(() => {
  if (collected.length === 0) return;
  const totalScore = (pick: (b: Benchmark) => number): number =>
    collected.reduce((s, c) => s + pick(c.bench), 0);
  const meanWin = totalScore((b) => b.winRate) / collected.length;
  const meanDelta = totalScore((b) => b.delta) / collected.length;

  console.log(
    `[eval] OVERALL  win-rate ${(meanWin * 100).toFixed(0)}%  mean Δ ${meanDelta >= 0 ? "+" : ""}${meanDelta.toFixed(2)} checks/fixture  (skill ${skillHash}, ${SAMPLES} samples)`,
  );
  console.log(evalUsageSummary());

  // Append a trend record. Timestamp via Date is available under Node/Vitest.
  const record = {
    ts: new Date().toISOString(),
    skill: skillHash,
    samples: SAMPLES,
    meanWinRate: meanWin,
    meanDelta,
    costUsd: evalUsage.costUsd,
    fixtures: collected.map((c) => ({ file: c.file, ...c.bench })),
  };
  appendFileSync(resultsLog, `${JSON.stringify(record)}\n`);
});

describe("react-architecture skill — improvement benchmark (skill vs baseline)", () => {
  for (const c of CASES) {
    it(`measures how much the skill beats baseline: ${c.label}`, (ctx) => {
      if (!ready) return ctx.skip();

      const skill: number[] = [];
      const baseline: number[] = [];
      let total = 0;
      for (let i = 0; i < SAMPLES; i++) {
        const s = score(refactor(c.file, "skill"), c.file);
        const b = score(refactor(c.file, "baseline"), c.file);
        skill.push(s.pass);
        baseline.push(b.pass);
        total = s.total;
        console.log(`  [pair ${i + 1}/${SAMPLES}] skill ${s.pass}/${s.total}  baseline ${b.pass}/${b.total}`);
      }

      const bench = summarize(skill, baseline, total);
      collected.push({ file: c.file, label: c.label, bench });
      console.log(
        `[eval] ${c.file}  skill ${bench.skillMean.toFixed(1)} vs baseline ${bench.baselineMean.toFixed(1)} /${total}  ` +
          `· win-rate ${(bench.winRate * 100).toFixed(0)}%  · Δ ${bench.delta >= 0 ? "+" : ""}${bench.delta.toFixed(2)}`,
      );

      // Structural only — no quality threshold, so this cannot flake. The signal is the
      // reported win-rate/delta and the results.jsonl trend, not red/green.
      expect(skill).toHaveLength(SAMPLES);
      expect(baseline).toHaveLength(SAMPLES);
    }, 2 * SAMPLES * 220_000);
  }
});
