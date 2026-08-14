import { describe, expect, it } from "vitest";
import { decide, type GuardInput } from "../../hooks/backlog-guard/decision";

/** A base context: config present, on a story branch, link mode. Override per test. */
function ctx(over: Partial<GuardInput>): GuardInput {
  return {
    configPresent: true,
    command: "git status",
    branch: "DIP-7.10/git-guard-hooks",
    base: "main",
    prMode: "link",
    headUnborn: false,
    remoteBranchExists: true,
    ...over,
  };
}

describe("decide — no-op path", () => {
  it("allows everything when no workflow config is present", () => {
    expect(decide(ctx({ configPresent: false, command: "git commit -m x", branch: "main" }))).toEqual({
      block: false,
    });
  });
});

describe("decide — blocking rules", () => {
  it("blocks commit on the base branch", () => {
    const d = decide(ctx({ command: 'git commit -m "x"', branch: "main" }));
    expect(d.block).toBe(true);
    if (d.block) expect(d.rule).toBe("no-commit-on-base");
  });

  it("blocks git add -A, --all and .", () => {
    for (const cmd of ["git add -A", "git add --all", "git add ."]) {
      const d = decide(ctx({ command: cmd }));
      expect(d.block, cmd).toBe(true);
      if (d.block) expect(d.rule).toBe("scoped-staging");
    }
  });

  it("blocks pushing the base branch", () => {
    const d = decide(ctx({ command: "git push origin main" }));
    expect(d.block).toBe(true);
    if (d.block) expect(d.rule).toBe("no-push-base");
  });

  it("blocks --no-verify", () => {
    const d = decide(ctx({ command: "git commit --no-verify -m x" }));
    expect(d.block).toBe(true);
    if (d.block) expect(d.rule).toBe("never-no-verify");
  });

  it("blocks gh/glab in link mode", () => {
    for (const cmd of ["gh pr create", "glab mr create"]) {
      const d = decide(ctx({ command: cmd }));
      expect(d.block, cmd).toBe(true);
      if (d.block) expect(d.rule).toBe("no-host-cli-in-link-mode");
    }
  });

  it("names the rule and the relaxing config key in the reason", () => {
    const d = decide(ctx({ command: "gh pr create" }));
    if (!d.block) throw new Error("expected block");
    expect(d.reason).toContain("no-host-cli-in-link-mode");
    expect(d.reason).toContain('pr.mode="create"');
  });
});

describe("decide — empty-repo bootstrap exceptions", () => {
  it("allows a commit on base when HEAD is unborn", () => {
    const d = decide(ctx({ command: 'git commit -m "chore: bootstrap"', branch: "main", headUnborn: true }));
    expect(d.block).toBe(false);
  });

  it("still blocks a commit on base once HEAD is born", () => {
    const d = decide(ctx({ command: 'git commit -m "x"', branch: "main", headUnborn: false }));
    expect(d.block).toBe(true);
    if (d.block) expect(d.rule).toBe("no-commit-on-base");
  });

  it("allows the first base push when the remote branch does not exist", () => {
    const d = decide(ctx({ command: "git push -u origin main", remoteBranchExists: false }));
    expect(d.block).toBe(false);
  });

  it("still blocks a base push once the remote branch exists", () => {
    const d = decide(ctx({ command: "git push origin main", remoteBranchExists: true }));
    expect(d.block).toBe(true);
    if (d.block) expect(d.rule).toBe("no-push-base");
  });
});

describe("decide — legitimate delivery commands pass", () => {
  it("allows commit and push on a story branch", () => {
    expect(decide(ctx({ command: 'git commit -m "feat: x (DIP-7.10)"' })).block).toBe(false);
    expect(decide(ctx({ command: "git push -u origin DIP-7.10/git-guard-hooks" })).block).toBe(false);
  });

  it("allows scoped git add", () => {
    expect(decide(ctx({ command: "git add hooks/backlog-guard/decision.ts" })).block).toBe(false);
  });

  it("allows gh in create mode", () => {
    expect(decide(ctx({ command: "gh pr create --draft", prMode: "create" })).block).toBe(false);
  });

  it("allows non-git, non-host commands", () => {
    expect(decide(ctx({ command: "bun run test" })).block).toBe(false);
  });

  it("does not confuse a branch whose name contains the base as a substring", () => {
    // pushing "mainline-feature" must not trip no-push-base for base "main"
    expect(decide(ctx({ command: "git push -u origin DIP-9.1/mainline-feature" })).block).toBe(false);
  });
});
