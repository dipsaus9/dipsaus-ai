import { defineConfig } from "vitest/config";

// Two suites:
// - unit — fast, deterministic, no network. Runs in CI (`bun run test`).
// - eval — the tests/eval fixture island (react + jsdom). On-command only
//   (`bun run test:eval:fixtures`); never part of the CI unit run.
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
          include: ["tests/eval/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/results/**"],
          environment: "jsdom",
          // testing-library auto-cleanup between tests hooks into a global
          // afterEach — without globals it silently leaks rendered DOM.
          globals: true,
        },
      },
    ],
  },
});
