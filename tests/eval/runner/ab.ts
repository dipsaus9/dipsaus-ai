import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { applyReport, runApply, type ApplyRunRecord, APPLY_RULE } from "./apply";
import { RULES, type EvalConfig } from "./config";
import { discoverCases, readSkillMd } from "./fixtures";
import { judgeRefactor, readExemplar } from "./judge";
import { aggregate } from "./matcher";
import { mapPool } from "./pool";
import {
  buildControlSystemPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  splitReviewCalls,
} from "./prompt";
import { runReview } from "./run";
import type { EvalReport, FixtureLabels, RunRecord } from "./types";

export type Arm = "skill" | "control";

export function armSystemPrompts(): Record<Arm, string> {
  return {
    skill: buildSystemPrompt(readSkillMd()),
    control: buildControlSystemPrompt(Object.keys(RULES)),
  };
}

/** Deterministic PRNG so shuffles are reproducible and testable. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

function categoryOf(fixture: string): string {
  return fixture.split("/")[0] ?? fixture;
}

export interface ArmCategoryStats {
  detectionRate: number | null;
  falsePositives: number;
  applyPassRate: number | null;
}

export interface AbDelta {
  category: string;
  model: string;
  skill: ArmCategoryStats;
  control: ArmCategoryStats;
}

export interface AbReport {
  kind: "ab-comparison";
  models: string[];
  deltas: AbDelta[];
  summary: string[];
  arms: {
    skill: { review: EvalReport; apply: EvalReport; applyRuns: ApplyRunRecord[] };
    control: { review: EvalReport; apply: EvalReport; applyRuns: ApplyRunRecord[] };
  };
}

function armStats(
  review: EvalReport,
  applyRuns: ApplyRunRecord[],
  category: string,
  model: string,
): ArmCategoryStats {
  const detectionScores = review.scores.filter(
    (score) =>
      score.model === model &&
      categoryOf(score.fixture) === category &&
      score.rule !== APPLY_RULE,
  );
  const detectionRate =
    detectionScores.length === 0
      ? null
      : detectionScores.reduce((sum, s) => sum + (s.runs === 0 ? 0 : s.detected / s.runs), 0) /
        detectionScores.length;
  const falsePositives = review.falsePositives.filter(
    (fp) => fp.model === model && categoryOf(fp.fixture) === category,
  ).length;
  const applies = applyRuns.filter(
    (run) => run.model === model && categoryOf(run.fixture) === category,
  );
  const applyPassRate =
    applies.length === 0 ? null : applies.filter((run) => run.pass).length / applies.length;
  return { detectionRate, falsePositives, applyPassRate };
}

const pct = (value: number | null): string =>
  value === null ? "n/a" : `${Math.round(value * 100)}%`;

export function computeAbReport(
  models: string[],
  skill: { review: EvalReport; apply: EvalReport; applyRuns: ApplyRunRecord[] },
  control: { review: EvalReport; apply: EvalReport; applyRuns: ApplyRunRecord[] },
): AbReport {
  const categories = [
    ...new Set([
      ...[...skill.review.scores, ...control.review.scores].map((score) =>
        categoryOf(score.fixture),
      ),
      ...[...skill.applyRuns, ...control.applyRuns].map((run) => categoryOf(run.fixture)),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const deltas: AbDelta[] = [];
  const summary: string[] = [];
  for (const model of models) {
    for (const category of categories) {
      const s = armStats(skill.review, skill.applyRuns, category, model);
      const c = armStats(control.review, control.applyRuns, category, model);
      deltas.push({ category, model, skill: s, control: c });

      if (s.detectionRate !== null && c.detectionRate !== null) {
        const diff = s.detectionRate - c.detectionRate;
        if (Math.abs(diff) < 0.05) {
          summary.push(`${model} / ${category}: skill adds no detection signal (${pct(s.detectionRate)} vs ${pct(c.detectionRate)})`);
        } else if (diff > 0) {
          summary.push(`${model} / ${category}: skill improves detection ${pct(c.detectionRate)} -> ${pct(s.detectionRate)}`);
        } else {
          summary.push(`${model} / ${category}: skill HURTS detection ${pct(c.detectionRate)} -> ${pct(s.detectionRate)}`);
        }
      }
      if (s.falsePositives !== c.falsePositives) {
        summary.push(
          `${model} / ${category}: false positives ${s.falsePositives} (skill) vs ${c.falsePositives} (control)${s.falsePositives > c.falsePositives ? " — skill HURTS precision" : ""}`,
        );
      }
      if (s.applyPassRate !== null && c.applyPassRate !== null && s.applyPassRate !== c.applyPassRate) {
        summary.push(
          `${model} / ${category}: apply pass rate ${pct(c.applyPassRate)} (control) -> ${pct(s.applyPassRate)} (skill)${s.applyPassRate < c.applyPassRate ? " — skill HURTS refactors" : ""}`,
        );
      }
    }
  }

  return { kind: "ab-comparison", models, deltas, summary, arms: { skill, control } };
}

/** reused results older than this draw a warning — arms should share one epoch */
export const REUSE_MAX_AGE_DAYS = 14;

export interface ReusedSkillArm {
  review: EvalReport;
  apply: EvalReport;
  applyRuns: ApplyRunRecord[];
  warnings: string[];
}

/**
 * Rebuild the skill arm from prior results files (--reuse-skill-arm, repeatable).
 * A trustworthy run is usually one full-matrix file plus filtered re-run files
 * that healed transient failures, so records merge by fixture|model|run with
 * later files winning. Reports are recomputed locally from the merged records
 * (aggregate / applyReport) — stored aggregates are never trusted, since no
 * single file's aggregate describes the merged set.
 */
export function loadReusedSkillArm(
  files: string[],
  config: EvalConfig,
  filter?: string,
  now: number = Date.now(),
): ReusedSkillArm {
  if (files.length === 0) {
    throw new Error("--reuse-skill-arm needs at least one results file");
  }
  const warnings: string[] = [];
  const reviewByKey = new Map<string, RunRecord>();
  const applyByKey = new Map<string, ApplyRunRecord>();
  for (const file of files) {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as {
      config?: { models?: string[]; runs?: number };
      reviewRuns?: RunRecord[];
      applyRuns?: ApplyRunRecord[];
    };
    const kind = parsed.reviewRuns ? "review" : parsed.applyRuns ? "apply" : null;
    if (kind === null) {
      throw new Error(`--reuse-skill-arm: ${file} has neither reviewRuns nor applyRuns`);
    }
    const stored = parsed.config ?? {};
    if (
      JSON.stringify(stored.models) !== JSON.stringify(config.models) ||
      stored.runs !== config.runs
    ) {
      throw new Error(
        `--reuse-skill-arm: ${file} was produced with models=${JSON.stringify(stored.models)} runs=${stored.runs}, current config wants models=${JSON.stringify(config.models)} runs=${config.runs}`,
      );
    }
    const ageDays = (now - statSync(file).mtimeMs) / 86_400_000;
    if (ageDays > REUSE_MAX_AGE_DAYS) {
      warnings.push(
        `--reuse-skill-arm: ${file} is ${Math.round(ageDays)} days old (> ${REUSE_MAX_AGE_DAYS}) — harness/corpus may have drifted since`,
      );
    }
    for (const record of parsed.reviewRuns ?? []) {
      reviewByKey.set(`${record.fixture}|${record.model}|${record.run}`, record);
    }
    for (const record of parsed.applyRuns ?? []) {
      applyByKey.set(`${record.fixture}|${record.model}|${record.run}`, record);
    }
  }

  // The merged set must be a complete, clean matrix over the *current* corpus —
  // holes or surviving failures mean the wrong (or too few) files were passed.
  const cases = discoverCases(filter);
  const missing: string[] = [];
  const failed: string[] = [];
  for (const model of config.models) {
    for (const fixture of cases) {
      for (let run = 1; run <= config.runs; run += 1) {
        const key = `${fixture.name}|${model}|${run}`;
        const review = reviewByKey.get(key);
        if (!review) {
          missing.push(`review ${key}`);
        } else if (!review.ok) {
          failed.push(`review ${key}: ${review.error ?? "failed"}`);
        }
        const isBadFixture = Object.values(fixture.labels.files).some(
          (label) => label.expected.length > 0,
        );
        if (!isBadFixture) {
          continue;
        }
        const apply = applyByKey.get(key);
        if (!apply) {
          missing.push(`apply ${key}`);
        } else if (apply.error !== undefined) {
          failed.push(`apply ${key}: ${apply.error}`);
        }
      }
    }
  }
  if (missing.length > 0 || failed.length > 0) {
    throw new Error(
      `--reuse-skill-arm: merged files do not form a clean full matrix.\n` +
        [...missing.map((m) => `missing: ${m}`), ...failed.map((f) => `failed: ${f}`)]
          .slice(0, 20)
          .join("\n"),
    );
  }

  const labelsByFixture = new Map<string, FixtureLabels>(
    cases.map((fixture) => [fixture.name, fixture.labels]),
  );
  const reviewRecords = [...reviewByKey.values()];
  const applyRuns = [...applyByKey.values()];
  return {
    review: aggregate(reviewRecords, labelsByFixture, {
      thresholds: config.thresholds,
      models: config.models,
      runs: config.runs,
    }),
    apply: applyReport(applyRuns, config),
    applyRuns,
    warnings,
  };
}

export interface AbRunOptions {
  config: EvalConfig;
  filter?: string;
  verbose?: boolean;
  /** apply-run sandboxes are preserved under <artifactsDir>/<arm>/ */
  artifactsDir?: string;
  /** results files whose merged records replace skill-arm execution */
  reuseSkillArm?: string[];
  log?: (message: string) => void;
}

/** Both arms, identical fixtures/models/K; only skill presence differs. */
export async function runAb(options: AbRunOptions): Promise<AbReport> {
  const { config, filter } = options;
  const log = options.log ?? (() => {});
  const prompts = armSystemPrompts();
  if (options.verbose) {
    console.log("=== ARM skill — system prompt ===\n" + prompts.skill);
    console.log("\n=== ARM control — system prompt ===\n" + prompts.control);
    // Both arms share the review-call split; show it once on a sample fixture.
    const sample = discoverCases(filter).find(
      (fixture) => splitReviewCalls(fixture).length > 1,
    );
    for (const call of sample ? splitReviewCalls(sample) : []) {
      console.log(
        `\n=== review call: ${call.kind} (${sample?.name}) — user prompt ===\n` +
          buildUserPrompt(call.sources),
      );
    }
  }

  const arms = {} as Record<Arm, { review: EvalReport; apply: EvalReport; applyRuns: ApplyRunRecord[] }>;
  if (options.reuseSkillArm) {
    const reused = loadReusedSkillArm(options.reuseSkillArm, config, filter);
    for (const warning of reused.warnings) {
      log(warning);
    }
    log(`--- arm: skill — reused from ${options.reuseSkillArm.length} results file(s) ---`);
    arms.skill = { review: reused.review, apply: reused.apply, applyRuns: reused.applyRuns };
  }
  for (const arm of ["skill", "control"] as const) {
    if (arm === "skill" && options.reuseSkillArm) {
      continue;
    }
    log(`--- arm: ${arm} — review ---`);
    const { report: review } = await runReview({
      config,
      filter,
      systemAppend: prompts[arm],
      log: (m) => log(`[${arm}] ${m}`),
    });
    log(`--- arm: ${arm} — apply ---`);
    const applyResult = await runApply({
      config,
      filter,
      systemAppend: prompts[arm],
      deferJudge: true,
      ...(options.artifactsDir
        ? { artifactsDir: path.join(options.artifactsDir, arm) }
        : {}),
      log: (m) => log(`[${arm}] ${m}`),
    });
    arms[arm] = { review, apply: applyResult.report, applyRuns: applyResult.runs };
  }

  // Judge both arms' pending refactors in one shuffled, arm-anonymous batch.
  const exemplarByFixture = new Map(
    discoverCases(filter).map((fixture) => [fixture.name, readExemplar(fixture.dir)]),
  );
  const jobs = shuffled(
    (["skill", "control"] as const).flatMap((arm) =>
      arms[arm].applyRuns
        .filter((run) => run.pendingJudgeRules && run.refactoredFiles)
        .map((run) => ({ arm, run })),
    ),
    0xd1e5a,
  );
  await mapPool(jobs, config.concurrency, async (job) => {
    const verdicts = await judgeRefactor({
      config,
      files: job.run.refactoredFiles ?? {},
      rules: job.run.pendingJudgeRules ?? [],
      exemplar: exemplarByFixture.get(job.run.fixture),
      log,
    });
    job.run.judgeVerdicts = verdicts;
    job.run.checks.judge = verdicts.every((verdict) => verdict.pass);
    job.run.pass = job.run.pass && (job.run.checks.judge ?? true);
    delete job.run.refactoredFiles;
    delete job.run.pendingJudgeRules;
  });

  return computeAbReport(config.models, arms.skill, arms.control);
}

export function printAbReport(report: AbReport): void {
  console.log("");
  console.log("A/B: skill vs control (per category × model)");
  for (const delta of report.deltas) {
    console.log(
      `  ${delta.model}  ${delta.category}  detection ${pct(delta.skill.detectionRate)} vs ${pct(delta.control.detectionRate)}  FPs ${delta.skill.falsePositives} vs ${delta.control.falsePositives}  apply ${pct(delta.skill.applyPassRate)} vs ${pct(delta.control.applyPassRate)}`,
    );
  }
  console.log("");
  console.log("Summary:");
  for (const line of report.summary) {
    console.log(`  ${line}`);
  }
  if (report.summary.length === 0) {
    console.log("  no differences between arms");
  }
}
