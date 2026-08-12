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
import {
  deliverDiffPasses,
  diffDeliverBaseline,
  runDeliver,
  toDeliverBaseline,
  type DeliverBaseline,
} from "./deliver";
import { discoverCases, readSkillMd } from "./fixtures";
import { aggregate } from "./matcher";
import { parseReviewOutput } from "./parser";
import { mapPool } from "./pool";
import { buildSystemPrompt, buildUserPrompt, splitReviewCalls } from "./prompt";
import { retryFailedRuns } from "./retry";
import { printReport } from "./report";
import type { EvalReport, FixtureLabels, RunRecord } from "./types";

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url));
export const BASELINE_PATH = path.resolve(RUNNER_DIR, "../baseline/review.json");
export const APPLY_BASELINE_PATH = path.resolve(RUNNER_DIR, "../baseline/apply.json");
export const DELIVER_BASELINE_PATH = path.resolve(RUNNER_DIR, "../baseline/deliver.json");

const fmtList = (xs: string[]): string => (xs.length > 0 ? xs.join(", ") : "none");

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
  const labelsByFixture = new Map<string, FixtureLabels>(
    cases.map((c) => [c.name, c.labels]),
  );

  const jobs = config.models.flatMap((model) =>
    cases.flatMap((fixture) =>
      Array.from({ length: config.runs }, (_, index) => ({
        model,
        fixture,
        run: index + 1,
      })),
    ),
  );
  const reviewWorker = async ({ model, fixture, run }: (typeof jobs)[number]): Promise<RunRecord> => {
      // Detection (Bad + Demo) and precision (Good alone) are separate calls —
      // the model must never see the Good twin next to the files it grades —
      // but they merge into ONE record per run so aggregate() counts K runs,
      // not K × calls. Findings self-attribute: each call's findings can only
      // name files that call saw.
      const calls = splitReviewCalls(fixture);
      const findings: RunRecord["findings"] = [];
      const raws: string[] = [];
      const errors: string[] = [];
      for (const call of calls) {
        log(`${model} × ${fixture.name} [${call.kind}] — run ${run}/${config.runs}`);
        const result = await invokeClaude({
          bin: config.claudeBin,
          model,
          systemAppend,
          prompt: buildUserPrompt(call.sources),
          timeoutMs: config.timeoutMs,
        });
        raws.push(`=== call: ${call.kind} ===\n${result.stdout}`);
        if (!result.ok) {
          errors.push(`${call.kind}: ${result.error ?? result.stderr.slice(0, 500)}`);
          continue;
        }
        const parsed = parseReviewOutput(result.stdout);
        if (!parsed.ok) {
          errors.push(`${call.kind}: ${parsed.reason ?? "unparseable output"}`);
          continue;
        }
        findings.push(...parsed.findings);
      }
      return {
        fixture: fixture.name,
        model,
        run,
        ok: errors.length === 0,
        findings,
        raw: raws.join("\n"),
        ...(errors.length === 0 ? {} : { error: errors.join(" | ") }),
      };
  };
  const firstPass: RunRecord[] = await mapPool(jobs, config.concurrency, reviewWorker);
  const records = await retryFailedRuns(jobs, firstPass, {
    retries: config.retries,
    failed: (record) => !record.ok,
    rerun: reviewWorker,
    describe: ({ model, fixture, run }) => `${model} × ${fixture.name} — run ${run}`,
    log,
  });

  const report = aggregate(records, labelsByFixture, {
    thresholds: config.thresholds,
    models: config.models,
    runs: config.runs,
  });
  // Findings and a truncated transcript stay in the results JSON so parser
  // blind spots and semantics changes can be diagnosed offline instead of
  // paying for a rerun.
  return {
    report,
    records: records.map((record) => ({ ...record, raw: record.raw.slice(0, 4000) })),
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
      concurrency: { type: "string" },
      timeout: { type: "string" },
      "reuse-skill-arm": { type: "string", multiple: true },
    },
  });
  const mode = values.mode ?? "review";
  if (mode !== "review" && mode !== "apply" && mode !== "ab" && mode !== "deliver") {
    throw new Error(`--mode must be review, apply, ab or deliver, got ${mode}`);
  }

  const config: EvalConfig = {
    ...defaultConfig,
    models: values.model && values.model.length > 0 ? values.model : defaultConfig.models,
    runs: values.runs ? Number(values.runs) : defaultConfig.runs,
    claudeBin: values["claude-bin"] ?? defaultConfig.claudeBin,
    concurrency: values.concurrency
      ? Number(values.concurrency)
      : defaultConfig.concurrency,
    // --timeout is in seconds (README talks in seconds) and governs the
    // agentic apply runs; review/judge single-shot calls keep timeoutMs.
    applyTimeoutMs: values.timeout
      ? Number(values.timeout) * 1000
      : defaultConfig.applyTimeoutMs,
  };
  if (!Number.isInteger(config.runs) || config.runs < 1) {
    throw new Error(`--runs must be a positive integer, got ${values.runs}`);
  }
  if (!Number.isInteger(config.concurrency) || config.concurrency < 1) {
    throw new Error(`--concurrency must be a positive integer, got ${values.concurrency}`);
  }
  if (!Number.isInteger(config.applyTimeoutMs) || config.applyTimeoutMs < 1000) {
    throw new Error(`--timeout must be a positive integer (seconds), got ${values.timeout}`);
  }

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactsRoot = path.join(RUNNER_DIR, "results", "artifacts", `${mode}-${runId}`);

  if (mode === "deliver") {
    // Deliver mode runs the agentic backlog-deliver corpus in throwaway repos and grades each
    // run deterministically + by a quality judge. Its baseline is per-fixture, not per-rule, so it
    // keeps its own file and diff rather than the review Baseline machinery.
    const records = await runDeliver({
      config,
      ...(values.filter ? { filter: values.filter } : {}),
      log: (message) => console.log(message),
    });
    const current = toDeliverBaseline(records);
    const committed: DeliverBaseline | null = existsSync(DELIVER_BASELINE_PATH)
      ? (JSON.parse(readFileSync(DELIVER_BASELINE_PATH, "utf8")) as DeliverBaseline)
      : null;

    console.log("\nDeliver scorecards:");
    for (const r of records) {
      if (r.error !== undefined || r.scorecard === undefined) {
        console.log(`  ${r.fixture}: ERROR ${r.error ?? "no scorecard"}`);
        continue;
      }
      const c = r.scorecard;
      const dims =
        `branch:${c.branch.pass ? "✓" : "✗"} verify:${c.verify.pass ? "✓" : "✗"} ` +
        `acs:${c.acs.pass ? "✓" : "✗"} scope:${c.scope.pass ? "✓" : "✗"} review:${c.review.pass ? "✓" : "✗"}`;
      const quality = r.judge?.judged ? (r.judge.verdict.pass ? "pass" : "fail") : "skipped";
      console.log(`  ${r.fixture}: ${c.pass ? "PASS" : "FAIL"} [${dims}] quality:${quality}`);
    }

    let deliverOk = true;
    if (values["update-baseline"]) {
      mkdirSync(path.dirname(DELIVER_BASELINE_PATH), { recursive: true });
      writeFileSync(DELIVER_BASELINE_PATH, `${JSON.stringify(current, null, 2)}\n`);
      console.log(`\nDeliver baseline updated: ${DELIVER_BASELINE_PATH} — commit it via PR.`);
    } else if (committed) {
      const diff = diffDeliverBaseline(committed, current);
      console.log(
        `\nDiff vs baseline — regressions: ${fmtList(diff.regressions)}; improvements: ${fmtList(diff.improvements)}; ` +
          `added: ${fmtList(diff.added)}; removed: ${fmtList(diff.removed)}`,
      );
      deliverOk = deliverDiffPasses(diff);
    } else {
      console.log("\nNo committed deliver baseline yet — run with --update-baseline to create one.");
    }

    const deliverOut = values.out ?? path.join(RUNNER_DIR, "results", `deliver-${runId}.json`);
    mkdirSync(path.dirname(deliverOut), { recursive: true });
    writeFileSync(deliverOut, `${JSON.stringify({ records, baseline: current }, null, 2)}\n`);
    console.log(`\nResults written to ${deliverOut}`);
    process.exitCode = deliverOk ? 0 : 1;
    return;
  }

  if (mode === "ab") {
    // A/B answers a different question on a different lifecycle: results are
    // stored beside the baseline outputs but never diffed against them.
    const abReport = await runAb({
      config,
      filter: values.filter,
      verbose: values.verbose,
      artifactsDir: artifactsRoot,
      ...(values["reuse-skill-arm"] ? { reuseSkillArm: values["reuse-skill-arm"] } : {}),
      log: (message) => console.log(message),
    });
    const abOut = values.out ?? path.join(RUNNER_DIR, "results", `ab-${runId}.json`);
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
      artifactsDir: artifactsRoot,
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

  const outPath = values.out ?? path.join(RUNNER_DIR, "results", `${mode}-${runId}.json`);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`);

  printReport(report);
  console.log(`\nResults written to ${outPath}`);
  process.exitCode = report.verdict.pass && baselineOk ? 0 : 1;
}

if (import.meta.main) {
  await main();
}
