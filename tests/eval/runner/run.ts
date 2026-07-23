import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { invokeClaude } from "./claude";
import { defaultConfig, type EvalConfig } from "./config";
import { discoverCases, readSkillMd } from "./fixtures";
import { aggregate } from "./matcher";
import { parseReviewOutput } from "./parser";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import { printReport } from "./report";
import type { EvalReport, FixtureLabels, RunRecord } from "./types";

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url));

export interface ReviewRunOptions {
  config: EvalConfig;
  filter?: string;
  log?: (message: string) => void;
}

/**
 * Review-mode eval: fixture × model × K headless claude calls, scored against
 * expected.json. Exported so later stories (baseline diff, A/B, apply mode)
 * can reuse the loop as a strategy.
 */
export async function runReview(options: ReviewRunOptions): Promise<EvalReport> {
  const { config, filter } = options;
  const log = options.log ?? (() => {});
  const cases = discoverCases(filter);
  if (cases.length === 0) {
    throw new Error(`no fixtures match filter ${JSON.stringify(filter ?? "")}`);
  }
  const systemAppend = buildSystemPrompt(readSkillMd());
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

  return aggregate(records, labelsByFixture, {
    lineTolerance: config.lineTolerance,
    thresholds: config.thresholds,
    models: config.models,
    runs: config.runs,
  });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      model: { type: "string", multiple: true },
      runs: { type: "string" },
      filter: { type: "string" },
      "claude-bin": { type: "string" },
      out: { type: "string" },
    },
  });

  const config: EvalConfig = {
    ...defaultConfig,
    models: values.model && values.model.length > 0 ? values.model : defaultConfig.models,
    runs: values.runs ? Number(values.runs) : defaultConfig.runs,
    claudeBin: values["claude-bin"] ?? defaultConfig.claudeBin,
  };
  if (!Number.isInteger(config.runs) || config.runs < 1) {
    throw new Error(`--runs must be a positive integer, got ${values.runs}`);
  }

  const report = await runReview({
    config,
    filter: values.filter,
    log: (message) => console.log(message),
  });

  const outPath =
    values.out ??
    path.join(
      RUNNER_DIR,
      "results",
      `review-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    );
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  printReport(report);
  console.log(`\nResults written to ${outPath}`);
  process.exitCode = report.verdict.pass ? 0 : 1;
}

if (import.meta.main) {
  await main();
}
