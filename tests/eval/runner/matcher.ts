import { severityOf } from "./config";
import type {
  EvalReport,
  ExpectedFinding,
  FalsePositive,
  Finding,
  FixtureLabels,
  RuleScore,
  RunRecord,
  VerdictFailure,
} from "./types";

/**
 * Models report files as bare names ("Bad.tsx"), fixture-relative paths
 * ("billing/index.ts") or longer paths — accept a match when either side is a
 * suffix of the other on a path-segment boundary.
 */
export function fileMatches(reportedFile: string, labelKey: string): boolean {
  const reported = reportedFile.replace(/^\.\//, "");
  return (
    reported === labelKey ||
    reported.endsWith(`/${labelKey}`) ||
    labelKey.endsWith(`/${reported}`)
  );
}

export interface RunMatch {
  detected: { file: string; expected: ExpectedFinding; hit: boolean }[];
  falsePositives: Finding[];
}

/**
 * Match one run's findings against a fixture's labels on **rule + file**.
 * The labeled line is documentation of the trigger, not part of the pass/fail
 * path: the first real eval run showed models find the right rule on the
 * right file near-perfectly but anchor lines inconsistently (props interface
 * vs signature, first hook vs the over-cap hook), so no line window is stable.
 */
export function matchRun(findings: Finding[], labels: FixtureLabels): RunMatch {
  const unclaimed = [...findings];
  const detected: RunMatch["detected"] = [];

  for (const [file, label] of Object.entries(labels.files)) {
    for (const expected of label.expected) {
      const index = unclaimed.findIndex(
        (finding) => fileMatches(finding.file, file) && finding.rule === expected.rule,
      );
      const hit = index >= 0;
      if (hit) {
        unclaimed.splice(index, 1);
      }
      detected.push({ file, expected, hit });
    }
  }

  const falsePositives = unclaimed.filter((finding) => {
    const entry = Object.entries(labels.files).find(([file]) =>
      fileMatches(finding.file, file),
    );
    if (!entry) {
      return true;
    }
    const [, label] = entry;
    // duplicates of an already-claimed expected rule are noise, not FPs
    if (label.expected.some((expected) => expected.rule === finding.rule)) {
      return false;
    }
    return !(label.alsoAcceptable ?? []).includes(finding.rule);
  });

  return { detected, falsePositives };
}

export interface AggregateConfig {
  thresholds: { high: number; medLow: number };
  models: string[];
  runs: number;
}

/** Aggregate all run records into per-rule scores, FPs and a pass verdict. */
export function aggregate(
  records: RunRecord[],
  labelsByFixture: Map<string, FixtureLabels>,
  config: AggregateConfig,
): EvalReport {
  const scoreMap = new Map<string, RuleScore>();
  const falsePositives: FalsePositive[] = [];
  const failedRuns: EvalReport["failedRuns"] = [];

  for (const record of records) {
    const labels = labelsByFixture.get(record.fixture);
    if (!labels) {
      continue;
    }
    const match = record.ok
      ? matchRun(record.findings, labels)
      : {
          detected: Object.entries(labels.files).flatMap(([file, label]) =>
            label.expected.map((expected) => ({ file, expected, hit: false })),
          ),
          falsePositives: [],
        };
    if (!record.ok) {
      failedRuns.push({
        fixture: record.fixture,
        model: record.model,
        run: record.run,
        error: record.error ?? "unparseable output",
      });
    }
    for (const { file, expected, hit } of match.detected) {
      const key = `${expected.rule}|${record.fixture}|${file}|${record.model}`;
      const score = scoreMap.get(key) ?? {
        rule: expected.rule,
        severity: severityOf(expected.rule),
        fixture: record.fixture,
        file,
        model: record.model,
        detected: 0,
        runs: 0,
      };
      score.runs += 1;
      if (hit) {
        score.detected += 1;
      }
      scoreMap.set(key, score);
    }
    for (const finding of match.falsePositives) {
      falsePositives.push({
        fixture: record.fixture,
        model: record.model,
        run: record.run,
        file: finding.file,
        rule: finding.rule,
        line: finding.line,
      });
    }
  }

  const failures: VerdictFailure[] = [];
  for (const score of scoreMap.values()) {
    const bar =
      score.severity === "high"
        ? config.thresholds.high
        : config.thresholds.medLow;
    const rate = score.runs === 0 ? 0 : score.detected / score.runs;
    if (rate + 1e-9 < bar) {
      failures.push({
        kind: "detection",
        rule: score.rule,
        fixture: score.fixture,
        model: score.model,
        detail: `${score.rule} on ${score.fixture}/${score.file}: ${score.detected}/${score.runs} (needs ≥${bar * 100}%)`,
      });
    }
  }
  for (const fp of falsePositives) {
    const labels = labelsByFixture.get(fp.fixture);
    const entry = Object.entries(labels?.files ?? {}).find(([file]) =>
      fileMatches(fp.file, file),
    );
    const isGoodTwin = entry !== undefined && entry[1].expected.length === 0;
    if (isGoodTwin) {
      failures.push({
        kind: "false-positive",
        rule: fp.rule,
        fixture: fp.fixture,
        model: fp.model,
        detail: `good twin ${fp.fixture}/${fp.file} flagged with ${fp.rule}:${fp.line} in run ${fp.run}`,
      });
    }
  }

  return {
    config: {
      models: config.models,
      runs: config.runs,
      thresholds: config.thresholds,
    },
    scores: [...scoreMap.values()],
    falsePositives,
    failedRuns,
    verdict: { pass: failures.length === 0, failures },
  };
}
