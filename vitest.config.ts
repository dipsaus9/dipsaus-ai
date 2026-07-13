import { defineConfig } from "vitest/config";

// One suite: unit — fast, deterministic, no network. Runs in CI (`bun run test`).
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
    ],
  },
});
