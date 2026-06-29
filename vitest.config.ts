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
          // Headless CLI + judge round-trips are slow.
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
});
