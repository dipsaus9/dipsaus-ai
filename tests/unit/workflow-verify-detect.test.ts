import { describe, expect, it } from "vitest";
import { detectVerify } from "../../src/workflow/verify-detect";

describe("detectVerify", () => {
  it("returns [] for a repo with no recognised manifest", () => {
    expect(detectVerify({})).toEqual([]);
  });

  it("node: maps the canonical scripts that exist, in deliver order, with the right pm", () => {
    const cmds = detectVerify({
      packageScripts: { test: "vitest", lint: "oxlint", build: "tsc" },
      nodePackageManager: "bun",
    });
    // lint before test before build; typecheck absent so skipped
    expect(cmds).toEqual(["bun run lint", "bun run test", "bun run build"]);
  });

  it("node: falls back to npm when no lockfile pm is given", () => {
    expect(detectVerify({ packageScripts: { test: "jest" } })).toEqual(["npm run test"]);
  });

  it("python: pytest only, plus ruff when configured", () => {
    expect(detectVerify({ hasPyproject: true })).toEqual(["pytest"]);
    expect(detectVerify({ hasPyproject: true, pyprojectHasRuff: true })).toEqual([
      "ruff check .",
      "pytest",
    ]);
  });

  it("go and rust return their canonical command lists", () => {
    expect(detectVerify({ hasGoMod: true })).toEqual([
      "go build ./...",
      "go vet ./...",
      "go test ./...",
    ]);
    expect(detectVerify({ hasCargo: true })).toEqual(["cargo build", "cargo clippy", "cargo test"]);
  });

  it("concatenates stacks in a stable order for a polyglot repo", () => {
    const cmds = detectVerify({
      packageScripts: { test: "vitest" },
      nodePackageManager: "npm",
      hasGoMod: true,
    });
    expect(cmds).toEqual(["npm run test", "go build ./...", "go vet ./...", "go test ./..."]);
  });
});
