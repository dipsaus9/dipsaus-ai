export type Severity = "high" | "med" | "low";

export interface Finding {
  severity: Severity;
  rule: string;
  file: string;
  line: number;
}

export interface ParseResult {
  ok: boolean;
  findings: Finding[];
  reason?: string;
}

export interface ExpectedFinding {
  rule: string;
  line: number;
}

export interface FileLabel {
  expected: ExpectedFinding[];
  alsoAcceptable?: string[];
}

export interface FixtureLabels {
  files: Record<string, FileLabel>;
}

export interface FixtureCase {
  /** e.g. "srp/loc-cap" */
  name: string;
  dir: string;
  labels: FixtureLabels;
  /** label-file key -> source text */
  sources: Record<string, string>;
}

export interface RunRecord {
  fixture: string;
  model: string;
  run: number;
  /** false = CLI failure or unparseable output; counts against detection */
  ok: boolean;
  findings: Finding[];
  raw: string;
  error?: string;
}

export interface RuleScore {
  rule: string;
  severity: Severity;
  fixture: string;
  file: string;
  model: string;
  detected: number;
  runs: number;
}

export interface FalsePositive {
  fixture: string;
  model: string;
  run: number;
  file: string;
  rule: string;
  line: number;
}

export interface VerdictFailure {
  kind: "detection" | "false-positive" | "failed-runs";
  rule?: string;
  fixture: string;
  model: string;
  detail: string;
}

export interface EvalReport {
  /** non-fatal signals, e.g. judge-instability (2–1 verdicts) */
  warnings?: string[];
  config: {
    models: string[];
    runs: number;
    thresholds: { high: number; medLow: number };
  };
  scores: RuleScore[];
  falsePositives: FalsePositive[];
  failedRuns: { fixture: string; model: string; run: number; error: string }[];
  verdict: { pass: boolean; failures: VerdictFailure[] };
}
