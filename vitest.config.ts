import { defineConfig } from "vitest/config";

// Two suites:
// - unit: fast, deterministic, no network. Runs in CI (`bun run test`).
// - eval: LLM-judge skill evals, billed + non-deterministic. Local only
//   (`bun run test:eval`), never in CI.
export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "eval",
          include: ["tests/eval/**/*.test.ts"],
          environment: "node",
          // Each eval case does up to 4 headless CLI round-trips (skill + baseline,
          // each scored by the judge), so allow generous time.
          testTimeout: 300_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
