import os from "node:os";
import type { Severity } from "./types";

/**
 * Rule id -> severity, mirroring the Rule index in
 * skills/react-architecture/SKILL.md. Renaming an id there is a breaking
 * change here — by design (ids are the skill/harness contract).
 */
export const RULES: Record<string, Severity> = {
  "srp.loc-cap": "high",
  "srp.hooks-cap": "high",
  "srp.props-cap": "high",
  "srp.effects-cap": "high",
  "srp.jsx-depth-cap": "high",
  "srp.mixed-concerns": "high",
  "srp.presentational": "med",
  "boundary.deep-import": "high",
  "boundary.foreign-logic": "high",
  "boundary.internal-state": "high",
  "boundary.hardwired-render": "high",
  "comp.regions-as-slots": "med",
  "comp.config-soup": "med",
  "comp.variant-compound": "med",
  "comp.slots-over-config": "med",
  "state.server-fetch": "high",
  "state.derived-effect": "high",
  "state.colocate": "med",
  "state.prop-drilling": "med",
  "state.global-discipline": "med",
};

export function severityOf(rule: string): Severity {
  return RULES[rule] ?? "med";
}

export interface EvalConfig {
  models: string[];
  runs: number;
  lineTolerance: number;
  /** minimum detection rate: high rules, and med/low rules */
  thresholds: { high: number; medLow: number };
  /** pinned judge model — consumed by the judge layer (DIP-2.9), placeholder here */
  judgeModel: string;
  claudeBin: string;
  timeoutMs: number;
}

export const defaultConfig: EvalConfig = {
  models: ["claude-sonnet-5"],
  runs: 5,
  lineTolerance: 2,
  thresholds: { high: 1, medLow: 0.8 },
  judgeModel: "claude-sonnet-5",
  claudeBin:
    process.env.CLAUDE_BIN ?? `${os.homedir()}/.local/bin/claude`,
  timeoutMs: 240_000,
};
