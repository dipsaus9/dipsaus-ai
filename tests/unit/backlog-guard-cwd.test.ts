import { describe, expect, it } from "vitest";
import { resolveGitCwd } from "../../hooks/backlog-guard/cwd";

const MAIN = "/repo";

describe("resolveGitCwd — worktree lane", () => {
  it("returns the base cwd when there is no leading cd", () => {
    expect(resolveGitCwd('git commit -m "x"', MAIN)).toBe(MAIN);
  });

  it("replays a relative cd into a worktree before git", () => {
    expect(resolveGitCwd('cd .worktrees/DIP-1.1 && git commit -m "x"', MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });

  it("honours an absolute cd target", () => {
    expect(resolveGitCwd("cd /repo/.worktrees/DIP-1.1 && git status", MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });

  it("strips quotes around the target", () => {
    expect(resolveGitCwd('cd "/repo/.worktrees/DIP-1.1" && git commit -m x', MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });

  it("applies cumulative cds up to the git segment", () => {
    expect(resolveGitCwd("cd .worktrees && cd DIP-1.1 && git commit -m x", MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });

  it("ignores a cd that comes after the git command", () => {
    expect(resolveGitCwd("cd .worktrees/DIP-1.1 && git commit -m x && cd /elsewhere", MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });

  it("tolerates cd flags", () => {
    expect(resolveGitCwd("cd -P .worktrees/DIP-1.1 && git status", MAIN)).toBe(
      "/repo/.worktrees/DIP-1.1",
    );
  });
});

describe("resolveGitCwd — unresolvable targets fall back (fail-open)", () => {
  it("leaves cwd unchanged for an env-var target", () => {
    expect(resolveGitCwd('cd "$WT" && git commit -m x', MAIN)).toBe(MAIN);
  });

  it("leaves cwd unchanged for a home-relative target", () => {
    expect(resolveGitCwd("cd ~/wt && git status", MAIN)).toBe(MAIN);
  });

  it("leaves cwd unchanged for cd -", () => {
    expect(resolveGitCwd("cd - && git status", MAIN)).toBe(MAIN);
  });

  it("does not treat a directory named git as the git command", () => {
    expect(resolveGitCwd("cd git-tools && git status", MAIN)).toBe("/repo/git-tools");
  });
});
