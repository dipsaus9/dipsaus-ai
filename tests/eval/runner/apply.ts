import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bannedPatterns, capViolations, measureComponents } from "./ast";
import { invokeClaude } from "./claude";
import type { EvalConfig } from "./config";
import { discoverCases, readSkillMd } from "./fixtures";
import { judgeRefactor, type JudgeVerdict } from "./judge";
import { buildSystemPrompt } from "./prompt";
import {
  assertSandboxPath,
  createSandbox,
  destroySandbox,
  hashDir,
  restoreBehaviorTest,
  sandboxSourceFiles,
  type Sandbox,
} from "./sandbox";
import type { EvalReport, FixtureCase, RuleScore, VerdictFailure } from "./types";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TSC_BIN = path.join(REPO_ROOT, "node_modules", ".bin", "tsc");
const VITEST_BIN = path.join(REPO_ROOT, "node_modules", ".bin", "vitest");

/** Pseudo-rule under which apply pass-rates fold into results + baseline. */
export const APPLY_RULE = "apply.pass";

export interface ApplyChecks {
  originalsUntouched: boolean;
  caps: boolean;
  banned: boolean;
  tsc: boolean;
  behaviorTests: boolean;
  /** majority verdicts across the fixture's judged rules; undefined = not judged
   * (no comp.* rules expected, or mechanical checks already failed) */
  judge?: boolean;
}

export interface ApplyRunRecord {
  fixture: string;
  model: string;
  run: number;
  pass: boolean;
  checks: ApplyChecks;
  /** failing command output / violation details, captured per AC5 */
  detail: string[];
  /** individual votes + reasoning per judged rule */
  judgeVerdicts?: JudgeVerdict[];
  error?: string;
}

export interface ApplyGrade {
  checks: Omit<ApplyChecks, "originalsUntouched">;
  detail: string[];
}

/** Mechanical grade of a refactored sandbox: caps, banned patterns, tsc, behavior tests. */
export function gradeSandbox(sandbox: Sandbox): ApplyGrade {
  const dir = assertSandboxPath(sandbox.dir);
  const detail: string[] = [];

  let caps = true;
  let banned = true;
  for (const file of sandboxSourceFiles(dir)) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(dir, file);
    const violations = capViolations(measureComponents(relative, source));
    for (const violation of violations) {
      caps = false;
      detail.push(
        `cap: ${relative} ${violation.component} ${violation.cap}=${violation.value} > ${violation.limit}`,
      );
    }
    for (const pattern of bannedPatterns(relative, source)) {
      banned = false;
      detail.push(`banned: ${relative} ${pattern.component} ${pattern.pattern}`);
    }
  }

  const tscResult = spawnSync(TSC_BIN, ["-p", dir], { encoding: "utf8", timeout: 120_000 });
  const tsc = tscResult.status === 0;
  if (!tsc) {
    detail.push(`tsc: ${(tscResult.stdout + tscResult.stderr).trim().slice(0, 2000)}`);
  }

  let behaviorTests = true;
  if (sandbox.pristineTest !== null) {
    const vitestResult = spawnSync(
      VITEST_BIN,
      ["run", "--root", dir, "--config", path.join(dir, "vitest.config.mts")],
      { encoding: "utf8", timeout: 180_000, cwd: dir },
    );
    behaviorTests = vitestResult.status === 0;
    if (!behaviorTests) {
      detail.push(`behavior-tests: ${(vitestResult.stdout + vitestResult.stderr).trim().slice(0, 2000)}`);
    }
  }

  return { checks: { caps, banned, tsc, behaviorTests }, detail };
}

function buildApplyPrompt(fixture: FixtureCase): string {
  const files = Object.keys(fixture.sources)
    .filter((file) => file.endsWith(".tsx") || file.endsWith(".ts"))
    .join(", ");
  return [
    "Run in APPLY mode on the current working directory.",
    `Refactor these files in place so they satisfy the skill's standards: ${files}.`,
    "Use your file tools to edit them. Preserve behavior — behavior.test.tsx",
    "must keep passing and MUST NOT be modified. Keep TypeScript strict-clean.",
    "You may create new files (extracted hooks/components) in this directory.",
    "Finish with the apply-mode summary in the skill's format.",
  ].join("\n");
}

export interface ApplyRunOptions {
  config: EvalConfig;
  filter?: string;
  log?: (message: string) => void;
}

export async function runApply(options: ApplyRunOptions): Promise<{
  report: EvalReport;
  runs: ApplyRunRecord[];
}> {
  const { config, filter } = options;
  const log = options.log ?? (() => {});
  const cases = discoverCases(filter).filter((fixture) =>
    Object.values(fixture.labels.files).some((label) => label.expected.length > 0),
  );
  if (cases.length === 0) {
    throw new Error(`no bad fixtures match filter ${JSON.stringify(filter ?? "")}`);
  }
  const systemAppend = buildSystemPrompt(readSkillMd());
  const runs: ApplyRunRecord[] = [];

  for (const model of config.models) {
    for (const fixture of cases) {
      const originalHash = hashDir(fixture.dir);
      for (let run = 1; run <= config.runs; run += 1) {
        log(`apply ${model} × ${fixture.name} — run ${run}/${config.runs}`);
        const sandbox = createSandbox(fixture.dir);
        try {
          const invocation = await invokeClaude({
            bin: config.claudeBin,
            model,
            systemAppend,
            prompt: buildApplyPrompt(fixture),
            timeoutMs: config.timeoutMs,
            cwd: sandbox.dir,
            extraArgs: [
              "--permission-mode",
              "acceptEdits",
              "--allowedTools",
              "Read,Edit,Write,Glob,Grep",
            ],
          });
          restoreBehaviorTest(sandbox);
          const originalsUntouched = hashDir(fixture.dir) === originalHash;
          if (!invocation.ok) {
            runs.push({
              fixture: fixture.name,
              model,
              run,
              pass: false,
              checks: { originalsUntouched, caps: false, banned: false, tsc: false, behaviorTests: false },
              detail: [],
              error: invocation.error ?? "CLI failure",
            });
            continue;
          }
          const grade = gradeSandbox(sandbox);
          const checks: ApplyChecks = { originalsUntouched, ...grade.checks };
          const detail = [...grade.detail];
          const mechanicalPass =
            originalsUntouched && grade.checks.caps && grade.checks.banned &&
            grade.checks.tsc && grade.checks.behaviorTests;
          const judgedRules = Object.values(fixture.labels.files)
            .flatMap((label) => label.expected.map((expected) => expected.rule))
            .filter((rule) => rule.startsWith("comp."));
          let judgeVerdicts: JudgeVerdict[] | undefined;
          if (mechanicalPass && judgedRules.length > 0) {
            const files: Record<string, string> = {};
            for (const file of sandboxSourceFiles(sandbox.dir)) {
              files[path.relative(sandbox.dir, file)] = readFileSync(file, "utf8");
            }
            judgeVerdicts = await judgeRefactor({ config, files, rules: judgedRules, log });
            checks.judge = judgeVerdicts.every((verdict) => verdict.pass);
            for (const verdict of judgeVerdicts.filter((v) => !v.pass)) {
              detail.push(
                `judge: ${verdict.rule} failed — ${verdict.majorityReasoning.join(" | ")}`,
              );
            }
          }
          runs.push({
            fixture: fixture.name,
            model,
            run,
            pass: mechanicalPass && (checks.judge ?? true),
            checks,
            detail,
            ...(judgeVerdicts ? { judgeVerdicts } : {}),
          });
        } finally {
          destroySandbox(sandbox);
        }
      }
    }
  }

  return { report: applyReport(runs, config), runs };
}

/** Fold pass rates into the review-shaped report so baseline diffing applies. */
export function applyReport(runs: ApplyRunRecord[], config: EvalConfig): EvalReport {
  const scoreMap = new Map<string, RuleScore>();
  const failures: VerdictFailure[] = [];
  const warnings: string[] = [];
  for (const record of runs) {
    for (const verdict of record.judgeVerdicts ?? []) {
      if (!verdict.unanimous) {
        warnings.push(
          `judge-instability: ${verdict.rule} on ${record.fixture} (${record.model}, run ${record.run}) decided 2–1`,
        );
      }
    }
  }
  for (const record of runs) {
    const key = `${record.fixture}|${record.model}`;
    const score = scoreMap.get(key) ?? {
      rule: APPLY_RULE,
      severity: "med" as const,
      fixture: record.fixture,
      file: "-",
      model: record.model,
      detected: 0,
      runs: 0,
    };
    score.runs += 1;
    if (record.pass) {
      score.detected += 1;
    }
    scoreMap.set(key, score);
    if (!record.checks.originalsUntouched) {
      failures.push({
        kind: "failed-runs",
        fixture: record.fixture,
        model: record.model,
        detail: `originals modified during ${record.fixture} run ${record.run} — sandbox breach`,
      });
    }
  }
  for (const score of scoreMap.values()) {
    const rate = score.runs === 0 ? 0 : score.detected / score.runs;
    if (rate + 1e-9 < config.thresholds.medLow) {
      failures.push({
        kind: "detection",
        rule: APPLY_RULE,
        fixture: score.fixture,
        model: score.model,
        detail: `${APPLY_RULE} on ${score.fixture}: ${score.detected}/${score.runs} (needs ≥${config.thresholds.medLow * 100}%)`,
      });
    }
  }
  return {
    ...(warnings.length > 0 ? { warnings } : {}),
    config: {
      models: config.models,
      runs: config.runs,
      lineTolerance: config.lineTolerance,
      thresholds: config.thresholds,
    },
    scores: [...scoreMap.values()],
    falsePositives: [],
    failedRuns: runs
      .filter((record) => record.error !== undefined)
      .map((record) => ({
        fixture: record.fixture,
        model: record.model,
        run: record.run,
        error: record.error ?? "",
      })),
    verdict: { pass: failures.length === 0, failures },
  };
}
