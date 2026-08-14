import { describe, expect, it } from "vitest";
import { parseConfig } from "../../src/workflow/schema";

const VALID = {
  parallelism: { maxAgents: 3 },
  worktree: { path: ".worktrees", install: "bun install", includeGitignored: [] },
  verify: ["bun run lint", "bun run test"],
  pr: { mode: "link" },
  review: { enabled: true, model: "", maxRounds: 3 },
  backlog: { dir: "backlog", prefix: "DIP" },
};

describe("parseConfig", () => {
  it("accepts a well-formed config", () => {
    const result = parseConfig(VALID);
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown top-level key with a field-level path", () => {
    const result = parseConfig({ ...VALID, wat: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.some((i) => i.path.includes("wat"))).toBe(true);
  });

  it("rejects a config that still carries the removed worktree.enabled key", () => {
    const result = parseConfig({
      ...VALID,
      worktree: { ...VALID.worktree, enabled: true },
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.some((i) => i.path === "worktree.enabled")).toBe(true);
  });

  it("rejects an unknown nested key", () => {
    const result = parseConfig({ ...VALID, pr: { mode: "link", extra: true } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.some((i) => i.path.startsWith("pr"))).toBe(true);
  });

  it("rejects an invalid pr mode", () => {
    const result = parseConfig({ ...VALID, pr: { mode: "merge" } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.some((i) => i.path === "pr.mode")).toBe(true);
  });

  it("rejects maxAgents below 1 and non-integer", () => {
    expect(parseConfig({ ...VALID, parallelism: { maxAgents: 0 } }).ok).toBe(false);
    expect(parseConfig({ ...VALID, parallelism: { maxAgents: 1.5 } }).ok).toBe(false);
  });

  it("reports every issue, not just the first", () => {
    const result = parseConfig({ ...VALID, pr: { mode: "nope" }, parallelism: { maxAgents: 0 } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
