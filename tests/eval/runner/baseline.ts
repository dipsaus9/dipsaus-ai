import type { EvalReport, RuleScore } from "./types";

export interface BaselineEntry {
  rule: string;
  fixture: string;
  file: string;
  model: string;
  detected: number;
  runs: number;
}

export interface Baseline {
  kind: "review-baseline";
  entries: BaselineEntry[];
}

export interface Regression {
  key: string;
  detail: string;
}

export interface BaselineDiff {
  /** rate drops vs baseline — fail the run */
  regressions: Regression[];
  /** baseline entries inside the current run's scope that the run no longer produces — fail, need --update-baseline */
  removed: Regression[];
  /** current entries absent from the baseline — informational */
  additions: string[];
  /** compared entries whose K differs — proportion compared, but flagged */
  kMismatches: string[];
  /** baseline entries outside the current scope (other models/fixtures) — ignored */
  outOfScope: number;
}

function entryKey(entry: { rule: string; fixture: string; file: string; model: string }): string {
  return `${entry.model}|${entry.fixture}|${entry.file}|${entry.rule}`;
}

function sortEntries(entries: BaselineEntry[]): BaselineEntry[] {
  return [...entries].sort((a, b) => entryKey(a).localeCompare(entryKey(b)));
}

/** Canonical, diff-stable baseline body: sorted entries, no timestamps. */
export function toBaseline(scores: RuleScore[]): Baseline {
  return {
    kind: "review-baseline",
    entries: sortEntries(
      scores.map(({ rule, fixture, file, model, detected, runs }) => ({
        rule,
        fixture,
        file,
        model,
        detected,
        runs,
      })),
    ),
  };
}

/**
 * Merge a (possibly --filter-narrowed) run into an existing baseline: entries
 * in the current run's scope (model AND fixture seen this run) are replaced,
 * everything out of scope is kept. A filtered update never clobbers the rest.
 */
export function mergeBaseline(existing: Baseline | null, current: Baseline): Baseline {
  if (!existing) {
    return current;
  }
  const models = new Set(current.entries.map((entry) => entry.model));
  const fixtures = new Set(current.entries.map((entry) => entry.fixture));
  const kept = existing.entries.filter(
    (entry) => !(models.has(entry.model) && fixtures.has(entry.fixture)),
  );
  return {
    kind: "review-baseline",
    entries: sortEntries([...kept, ...current.entries]),
  };
}

export function diffBaseline(baseline: Baseline, current: Baseline): BaselineDiff {
  const models = new Set(current.entries.map((entry) => entry.model));
  const fixtures = new Set(current.entries.map((entry) => entry.fixture));
  const currentByKey = new Map(current.entries.map((entry) => [entryKey(entry), entry]));

  const regressions: Regression[] = [];
  const removed: Regression[] = [];
  const kMismatches: string[] = [];
  let outOfScope = 0;
  const seenBaselineKeys = new Set<string>();

  for (const old of baseline.entries) {
    const key = entryKey(old);
    seenBaselineKeys.add(key);
    if (!(models.has(old.model) && fixtures.has(old.fixture))) {
      outOfScope += 1;
      continue;
    }
    const now = currentByKey.get(key);
    const label = `${old.rule} on ${old.fixture}/${old.file} @ ${old.model}`;
    if (!now) {
      removed.push({
        key,
        detail: `${label}: in baseline (${old.detected}/${old.runs}) but not produced by this run — refresh with --update-baseline if intended`,
      });
      continue;
    }
    if (now.runs !== old.runs) {
      kMismatches.push(`${label}: baseline K=${old.runs}, run K=${now.runs} — compared as proportions`);
    }
    const oldRate = old.runs === 0 ? 0 : old.detected / old.runs;
    const newRate = now.runs === 0 ? 0 : now.detected / now.runs;
    if (newRate + 1e-9 < oldRate) {
      regressions.push({
        key,
        detail: `${label}: ${old.detected}/${old.runs} -> ${now.detected}/${now.runs}`,
      });
    }
  }

  const additions = current.entries
    .filter((entry) => !seenBaselineKeys.has(entryKey(entry)))
    .map((entry) => `${entry.rule} on ${entry.fixture}/${entry.file} @ ${entry.model}: ${entry.detected}/${entry.runs}`);

  return { regressions, removed, additions, kMismatches, outOfScope };
}

export function printDiff(diff: BaselineDiff): void {
  console.log("");
  console.log("Baseline diff:");
  if (diff.regressions.length === 0 && diff.removed.length === 0) {
    console.log("  no regressions");
  }
  for (const regression of diff.regressions) {
    console.log(`  REGRESSION ${regression.detail}`);
  }
  for (const removal of diff.removed) {
    console.log(`  REMOVED ${removal.detail}`);
  }
  for (const addition of diff.additions) {
    console.log(`  addition ${addition}`);
  }
  for (const mismatch of diff.kMismatches) {
    console.log(`  k-mismatch ${mismatch}`);
  }
  if (diff.outOfScope > 0) {
    console.log(`  (${diff.outOfScope} baseline entr(y/ies) outside this run's scope — untouched)`);
  }
}

export function diffPasses(diff: BaselineDiff): boolean {
  return diff.regressions.length === 0 && diff.removed.length === 0;
}

/** Extend a report with the diff so the JSON output carries it too. */
export function attachDiff(report: EvalReport, diff: BaselineDiff): EvalReport & { baselineDiff: BaselineDiff } {
  return { ...report, baselineDiff: diff };
}
