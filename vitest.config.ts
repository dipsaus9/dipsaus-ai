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
          // beforeAll drives the entire matrix (models × fixtures × samples × 2 variants)
          // through a bounded pool, so the long timeout lives on the hook. The tests
          // themselves are pure aggregation over data the hook already collected.
          testTimeout: 30_000,
          hookTimeout: 60 * 60_000,
        },
      },
    ],
  },
});
