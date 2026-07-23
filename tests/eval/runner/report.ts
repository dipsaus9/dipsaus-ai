import type { EvalReport } from "./types";

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

export function printReport(report: EvalReport): void {
  const { scores, falsePositives, failedRuns, verdict } = report;

  console.log("");
  console.log("Per-rule detection (rule × fixture × model):");
  const ruleWidth = Math.max(4, ...scores.map((s) => s.rule.length));
  const fixtureWidth = Math.max(7, ...scores.map((s) => s.fixture.length));
  const modelWidth = Math.max(5, ...scores.map((s) => s.model.length));
  console.log(
    `  ${pad("rule", ruleWidth)}  ${pad("fixture", fixtureWidth)}  ${pad("model", modelWidth)}  sev   rate`,
  );
  for (const score of [...scores].sort((a, b) =>
    `${a.model}|${a.fixture}|${a.rule}`.localeCompare(`${b.model}|${b.fixture}|${b.rule}`),
  )) {
    console.log(
      `  ${pad(score.rule, ruleWidth)}  ${pad(score.fixture, fixtureWidth)}  ${pad(score.model, modelWidth)}  ${pad(score.severity, 4)}  ${score.detected}/${score.runs}`,
    );
  }

  if (falsePositives.length > 0) {
    console.log("");
    console.log("False positives:");
    for (const fp of falsePositives) {
      console.log(
        `  ${fp.fixture}/${fp.file} — ${fp.rule}:${fp.line} (${fp.model}, run ${fp.run})`,
      );
    }
  }
  if (failedRuns.length > 0) {
    console.log("");
    console.log("Failed runs (CLI error or unparseable output):");
    for (const failed of failedRuns) {
      console.log(`  ${failed.fixture} (${failed.model}, run ${failed.run}): ${failed.error}`);
    }
  }

  console.log("");
  if (verdict.pass) {
    console.log("VERDICT: PASS");
  } else {
    console.log(`VERDICT: FAIL (${verdict.failures.length} violation(s))`);
    for (const failure of verdict.failures) {
      console.log(`  [${failure.kind}] ${failure.detail}`);
    }
  }
}
