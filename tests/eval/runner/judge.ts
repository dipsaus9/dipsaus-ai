import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invokeClaude } from "./claude";
import type { EvalConfig } from "./config";

export const RUBRICS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../rubrics",
);

export interface JudgeVote {
  verdict: "pass" | "fail";
  reasoning: string;
  /** false when the raw output was unparseable and the vote fell back to fail */
  parsed: boolean;
}

export interface JudgeVerdict {
  rule: string;
  pass: boolean;
  votes: JudgeVote[];
  unanimous: boolean;
  /** reasoning lines of the majority side */
  majorityReasoning: string[];
}

/** Rules that have a rubric on disk — the judged subset. */
export function judgeableRules(rules: string[]): string[] {
  return rules.filter((rule) => existsSync(path.join(RUBRICS_DIR, `${rule}.md`)));
}

export function readRubric(rule: string): string {
  return readFileSync(path.join(RUBRICS_DIR, `${rule}.md`), "utf8");
}

/**
 * Blind prompt: rubric + refactored sources only. No model ids, no skill-on/off
 * arm, no fixture labels, no run metadata — DIP-2.10 reuses this blindness.
 */
export function buildJudgePrompt(rubric: string, files: Record<string, string>): string {
  const sources = Object.entries(files)
    .map(([name, content]) => `### File: ${name}\n\n\`\`\`tsx\n${content}\`\`\``)
    .join("\n\n");
  return [
    "You are judging a React/TypeScript refactor against one rubric.",
    "Apply ONLY the rubric below to the code below. Be strict: when criteria",
    "conflict or evidence is ambiguous, fail.",
    "",
    "Answer in exactly this format and nothing else:",
    "VERDICT: pass|fail",
    "REASONING: <one short paragraph citing the rubric criteria>",
    "",
    "---",
    rubric,
    "---",
    "",
    sources,
  ].join("\n");
}

export function parseJudgeVote(raw: string): JudgeVote {
  const match = /VERDICT:\s*(pass|fail)/i.exec(raw);
  const reasoningMatch = /REASONING:\s*([\s\S]*)/i.exec(raw);
  if (!match || match[1] === undefined) {
    return {
      verdict: "fail",
      reasoning: `unparseable judge output: ${raw.trim().slice(0, 200)}`,
      parsed: false,
    };
  }
  return {
    verdict: match[1].toLowerCase() as "pass" | "fail",
    reasoning: (reasoningMatch?.[1] ?? "").trim().slice(0, 1000),
    parsed: true,
  };
}

export function majorityVerdict(rule: string, votes: JudgeVote[]): JudgeVerdict {
  const passVotes = votes.filter((vote) => vote.verdict === "pass").length;
  const pass = passVotes * 2 > votes.length;
  const majority = votes.filter((vote) => vote.verdict === (pass ? "pass" : "fail"));
  return {
    rule,
    pass,
    votes,
    unanimous: passVotes === 0 || passVotes === votes.length,
    majorityReasoning: majority.map((vote) => vote.reasoning),
  };
}

export interface JudgeOptions {
  config: EvalConfig;
  /** refactored sources, relative name -> content */
  files: Record<string, string>;
  rules: string[];
  log?: (message: string) => void;
}

/** 3 votes per rule via the exact pinned judge model; majority decides. */
export async function judgeRefactor(options: JudgeOptions): Promise<JudgeVerdict[]> {
  const { config, files, rules } = options;
  const log = options.log ?? (() => {});
  const verdicts: JudgeVerdict[] = [];
  for (const rule of judgeableRules(rules)) {
    const prompt = buildJudgePrompt(readRubric(rule), files);
    const votes: JudgeVote[] = [];
    for (let vote = 1; vote <= config.judgeVotes; vote += 1) {
      log(`judge ${rule} — vote ${vote}/${config.judgeVotes}`);
      const result = await invokeClaude({
        bin: config.claudeBin,
        model: config.judgeModel,
        systemAppend: "",
        prompt,
        timeoutMs: config.timeoutMs,
      });
      votes.push(
        result.ok
          ? parseJudgeVote(result.stdout)
          : { verdict: "fail", reasoning: `judge CLI failure: ${result.error ?? ""}`, parsed: false },
      );
    }
    verdicts.push(majorityVerdict(rule, votes));
  }
  return verdicts;
}
