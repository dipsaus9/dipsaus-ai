import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  attachDiff,
  diffBaseline,
  diffPasses,
  mergeBaseline,
  printDiff,
  toBaseline,
  type Baseline,
} from "./baseline";
import { printAbReport, runAb } from "./ab";
import { runApply } from "./apply";
import { invokeClaude } from "./claude";
import { defaultConfig, type EvalConfig } from "./config";
import { discoverCases, readSkillMd } from "./fixtures";
import { aggregate } from "./matcher";
import { parseReviewOutput } from "./parser";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { printReport } from "./report";
import type { EvalReport, FixtureLabels, RunRecord } from "./types";

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const BASELINE_PATH = path.resolve(RUNNER_DIR, "../baseline/review.json");
export const APPLY_BASELINE_PATH = path.resolve(RUNNER_DIR, "../baseline/apply.json");

export interface ReviewRunOptions {
  config: EvalConfig;
  filter?: string;
  /** override the system prompt (A/B control arm); default = skill loaded */
  systemAppend?: string;
  log?: (message: string) => void;
}

/**
 * Review-mode eval: fixture × model × K headless claude calls, scored against
 * expected.json. Exported so later stories (baseline diff, A/B, apply mode)
 * can reuse the loop as a strategy.
 */
export async function runReview(options: ReviewRunOptions): Promise<{
  report: EvalReport;
  records: Omit<RunRecord, "raw">[];
}> {
  const { config, filter } = options;
  const log = options.log ?? (() => {});
  const cases = discoverCases(filter);
  if (cases.length === 0) {
    throw new Error(`no fixtures match filter ${JSON.stringify(filter ?? "")}`);
  }
  const systemAppend = options.systemAppend ?? buildSystemPrompt(readSkillMd());
  const records: RunRecord[] = [];
  const labelsByFixture = new Map<string, FixtureLabels>(
    cases.map((c) => [c.name, c.labels]),
  );

  for (const model of config.models) {
    for (const fixture of cases) {
      const prompt = buildUserPrompt(fixture);
      for (let run = 1; run <= config.runs; run += 1) {
        log(`${model} × ${fixture.name} — run ${run}/${config.runs}`);
        const result = await invokeClaude({
          bin: config.claudeBin,
          model,
          systemAppend,
          prompt,
          timeoutMs: config.timeoutMs,
        });
        if (!result.ok) {
          records.push({
            fixture: fixture.name,
            model,
            run,
            ok: false,
            findings: [],
            raw: result.stdout,
            error: result.error ?? result.stderr.slice(0, 500),
          });
          continue;
        }
        const parsed = parseReviewOutput(result.stdout);
        records.push({
          fixture: fixture.name,
          model,
          run,
          ok: parsed.ok,
          findings: parsed.findings,
          raw: result.stdout,
          ...(parsed.ok ? {} : { error: parsed.reason ?? "unparseable output" }),
        });
      }
    }
  }

  const report = aggregate(records, labelsByFixture, {
    thresholds: config.thresholds,
    models: config.models,
    runs: config.runs,
  });
  // Raw findings stay in the results JSON so semantics changes can be
  // re-scored offline instead of paying for a rerun.
  return {
    report,
    records: records.map(({ raw: _raw, ...rest }) => rest),
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      model: { type: "string", multiple: true },
      runs: { type: "string" },
      filter: { type: "string" },
      "claude-bin": { type: "string" },
      out: { type: "string" },
      "update-baseline": { type: "boolean" },
      mode: { type: "string" },
      verbose: { type: "boolean" },
    },
  });
  const mode = values.mode ?? "review";
  if (mode !== "review" && mode !== "apply" && mode !== "ab") {
    throw new Error(`--mode must be review, apply or ab, got ${mode}`);
  }

  const config: EvalConfig = {
    ...defaultConfig,
    models: values.model && values.model.length > 0 ? values.model : defaultConfig.models,
    runs: values.runs ? Number(values.runs) : defaultConfig.runs,
    claudeBin: values["claude-bin"] ?? defaultConfig.claudeBin,
  };
  if (!Number.isInteger(config.runs) || config.runs < 1) {
    throw new Error(`--runs must be a positive integer, got ${values.runs}`);
  }

  if (mode === "ab") {
    // A/B answers a different question on a different lifecycle: results are
    // stored beside the baseline outputs but never diffed against them.
    const abReport = await runAb({
      config,
      filter: values.filter,
      verbose: values.verbose,
      log: (message) => console.log(message),
    });
    const abOut =
      values.out ??
      path.join(
        RUNNER_DIR,
        "results",
        `ab-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      );
    mkdirSync(path.dirname(abOut), { recursive: true });
    writeFileSync(abOut, `${JSON.stringify(abReport, null, 2)}\n`);
    printAbReport(abReport);
    console.log(`\nResults written to ${abOut}`);
    return;
  }

  let report: EvalReport;
  let applyRuns: object[] | undefined;
  let reviewRuns: object[] | undefined;
  if (mode === "apply") {
    const applyResult = await runApply({
      config,
      filter: values.filter,
      log: (message) => console.log(message),
    });
    report = applyResult.report;
    applyRuns = applyResult.runs;
  } else {
    const reviewResult = await runReview({
      config,
      filter: values.filter,
      log: (message) => console.log(message),
    });
    report = reviewResult.report;
    reviewRuns = reviewResult.records;
  }

  const baselinePath = mode === "apply" ? APPLY_BASELINE_PATH : BASELINE_PATH;
  const current = toBaseline(report.scores);
  const existing: Baseline | null = existsSync(baselinePath)
    ? (JSON.parse(readFileSync(baselinePath, "utf8")) as Baseline)
    : null;

  const extras = {
    ...(applyRuns ? { applyRuns } : {}),
    ...(reviewRuns ? { reviewRuns } : {}),
  };
  let output: object = { ...report, ...extras };
  let baselineOk = true;
  if (values["update-baseline"]) {
    const merged = mergeBaseline(existing, current);
    mkdirSync(path.dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, `${JSON.stringify(merged, null, 2)}\n`);
    console.log(`\nBaseline updated: ${baselinePath} — commit it via PR.`);
  } else if (existing) {
    const diff = diffBaseline(existing, current);
    printDiff(diff);
    output = { ...attachDiff(report, diff), ...extras };
    baselineOk = diffPasses(diff);
  } else {
    console.log("\nNo committed baseline yet — run with --update-baseline to create one.");
  }

  const outPath =
    values.out ??
    path.join(
      RUNNER_DIR,
      "results",
      `${mode}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  printReport(report);
  console.log(`\nResults written to ${outPath}`);
  process.exitCode = report.verdict.pass && baselineOk ? 0 : 1;
}

if (import.meta.main) {
  await main();
}
