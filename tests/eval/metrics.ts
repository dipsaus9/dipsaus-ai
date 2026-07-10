import { basename } from "node:path";

// Detailed, deterministic checks — one per concrete rule in the react-architecture
// standards (SKILL.md). Each names the standard + severity it validates, so a fixture's
// score reads as "how much of my standard the refactor actually met". No LLM judge: stable.

export type Severity = "high" | "med";
export type Check = {
  /** Which standard this validates (category + rule). */
  standard: string;
  severity: Severity;
  /** What, concretely, must be true of the refactored code. */
  desc: string;
  ok: (code: string) => boolean;
};

const count = (code: string, re: RegExp): number => (code.match(re) ?? []).length;

// Count destructured props on the first component (function or arrow, Uppercase name).
// Returns -1 if no component signature is found, so callers can treat it as "not applicable".
function primaryPropsCount(code: string): number {
  const fn = code.match(/(?:export\s+)?function\s+[A-Z]\w*\s*\(\s*\{([^}]*)\}/s);
  const arrow = code.match(/(?:export\s+)?const\s+[A-Z]\w*\s*=\s*\(\s*\{([^}]*)\}/s);
  const body = fn?.[1] ?? arrow?.[1];
  if (body === undefined) return -1;
  return body.split(",").filter((s) => s.trim().length > 0).length;
}

export const CHECKS: Record<string, Check[]> = {
  // Category 3 (prop-drilling → composition first, context second).
  "prop-drilling.tsx": [
    {
      standard: "State & data · prop-drilling",
      severity: "med",
      desc: "`user` is no longer threaded into the intermediate <Layout>",
      ok: (c) => !/<Layout\b[^>]*\buser\s*=/.test(c),
    },
    {
      standard: "State & data · prop-drilling",
      severity: "med",
      desc: "`user` is no longer threaded into the intermediate <Sidebar>",
      ok: (c) => !/<Sidebar\b[^>]*\buser\s*=/.test(c),
    },
    {
      standard: "State & data · prop-drilling",
      severity: "med",
      desc: "fixed via composition — children/slots are used",
      ok: (c) => /\bchildren\b/.test(c) || /:\s*ReactNode/.test(c),
    },
    {
      standard: "State & data · prop-drilling (composition first, context second)",
      severity: "med",
      desc: "solved without reaching for React Context",
      ok: (c) => !/\b(createContext|useContext)\b/.test(c),
    },
  ],

  // Category 1 (feature boundaries — every violation here is [high]).
  "cross-feature-coupling.tsx": [
    {
      standard: "Feature boundaries · deep imports",
      severity: "high",
      desc: "no deep imports into billing internals (public API/barrel only)",
      ok: (c) => !/from\s*["']@\/features\/billing\/[^"']+\/[^"']+["']/.test(c),
    },
    {
      standard: "Feature boundaries · embedded foreign domain logic",
      severity: "high",
      desc: "tax rules not computed here (no calcTax call)",
      ok: (c) => !/\bcalcTax\s*\(/.test(c),
    },
    {
      standard: "Feature boundaries · cross-feature internal state",
      severity: "high",
      desc: "does not depend on billing's internal store (useBillingStore)",
      ok: (c) => !/\buseBillingStore\b/.test(c),
    },
    {
      standard: "Feature boundaries · embedded foreign domain logic",
      severity: "high",
      desc: "does not reference billing's internal constants (INVOICE_STATUS)",
      ok: (c) => !/\bINVOICE_STATUS\b/.test(c),
    },
    {
      standard: "Feature boundaries · hardwired child-feature rendering",
      severity: "high",
      desc: "billing's concrete component is not hardwired inline (BillingInvoiceTable)",
      ok: (c) => !/<BillingInvoiceTable\b/.test(c),
    },
  ],

  // Category 2 (compound components & composition — regions as slots, not config props).
  "config-soup-card.tsx": [
    {
      standard: "Compound components · ban boolean-flag soup",
      severity: "med",
      desc: "boolean config props removed (showHeader/showAvatar/hideFooter)",
      ok: (c) => !/\b(showHeader|showAvatar|hideFooter)\b/.test(c),
    },
    {
      standard: "Compound components · compound API (Component.Part)",
      severity: "med",
      // Opinionated: the standard mandates a compound namespace (Card.Header/Body/Footer),
      // not just generic children — so ≥2 distinct Card.* parts must exist.
      desc: "compound namespace API introduced (≥2 distinct Card.* parts)",
      ok: (c) => new Set(c.match(/\bCard\.\w+/g) ?? []).size >= 2,
    },
    {
      standard: "Compound components · regions as slots not props",
      severity: "med",
      desc: "footer content is composed, not passed as a `footerText` prop",
      ok: (c) => !/\bfooterText\b/.test(c),
    },
    {
      standard: "Compound components · regions as slots not props",
      severity: "med",
      desc: "body content is composed, not passed as a `bodyText` prop",
      ok: (c) => !/\bbodyText\b/.test(c),
    },
  ],

  // Category 1 SRP caps + Category 3 state/data boundaries.
  "god-component.tsx": [
    {
      standard: "State & data · no derived state in useEffect",
      severity: "high",
      desc: "derived `fullName` computed in render, not mirrored via effect (no setFullName)",
      ok: (c) => !/\bsetFullName\b/.test(c),
    },
    {
      standard: "SRP · hard cap: ≤2 useEffect per component",
      severity: "high",
      desc: "at most 2 useEffect remain in the file",
      ok: (c) => count(c, /useEffect\s*\(/g) <= 2,
    },
    {
      standard: "State & data · server fetching out of leaf components",
      severity: "high",
      // Standard allows any of: a custom hook, a server-state lib (react-query/SWR),
      // or the router loader pattern — as long as it's not raw fetch in the component.
      desc: "server fetching via a hook / query lib / loader, not raw in the component",
      ok: (c) =>
        /\b(function|const)\s+use[A-Z]\w*/.test(c) ||
        /\buse(Query|SWR|LoaderData)\b/.test(c) ||
        /\bloader\b\s*[:=]/.test(c),
    },
    {
      standard: "SRP · one reason to change (split mixed concerns)",
      severity: "med",
      desc: "decomposed into ≥2 components/hooks (a presentational part or hook extracted)",
      // Count component (Uppercase) and hook (use…) definitions only — not local consts.
      ok: (c) => count(c, /\b(function|const)\s+([A-Z]\w*|use[A-Z]\w*)\b/g) >= 2,
    },
    {
      standard: "SRP · hard cap: ≤6 props per component",
      severity: "high",
      // Opinionated cap. The fixture's component has 7 props; the skill enforces the cap
      // (group/split), where an unguided refactor often leaves the prop list intact.
      desc: "primary component exposes ≤6 props",
      ok: (c) => {
        const n = primaryPropsCount(c);
        return n === -1 || n <= 6;
      },
    },
  ],
};

export type CheckResult = { standard: string; severity: Severity; desc: string; pass: boolean };
export type Scorecard = { total: number; pass: number; results: CheckResult[] };

/** Score refactored code against the detailed checks for its fixture. */
export function score(code: string, fixturePath: string): Scorecard {
  const checks = CHECKS[basename(fixturePath)];
  if (!checks) throw new Error(`no checks defined for ${fixturePath}`);
  const results = checks.map((c) => ({
    standard: c.standard,
    severity: c.severity,
    desc: c.desc,
    pass: c.ok(code),
  }));
  return { total: checks.length, pass: results.filter((r) => r.pass).length, results };
}

export type Benchmark = {
  n: number;
  total: number;
  skillMean: number;
  baselineMean: number;
  delta: number;
  /** Fraction of paired samples where skill scored higher than baseline (ties count ½). */
  winRate: number;
};

const mean = (xs: number[]): number => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

/**
 * Turn paired skill/baseline score samples into an A/B measurement. This is the de-flake:
 * we stop asserting a pass/fail cliff on one stochastic run and instead REPORT how much
 * the skill beats the baseline across samples — a number you track as the skill changes.
 */
export function summarize(skill: number[], baseline: number[], total: number): Benchmark {
  const n = Math.min(skill.length, baseline.length);
  let winScore = 0;
  for (let i = 0; i < n; i++) {
    const s = skill[i]!;
    const b = baseline[i]!;
    winScore += s > b ? 1 : s === b ? 0.5 : 0;
  }
  return {
    n,
    total,
    skillMean: mean(skill),
    baselineMean: mean(baseline),
    delta: mean(skill) - mean(baseline),
    winRate: n ? winScore / n : 0,
  };
}

