import { describe, expect, it } from "vitest";
import { findCollisions, pathsCollide, referencesCollide } from "../../src/workflow/collisions";

describe("pathsCollide", () => {
  it("treats a directory as a prefix of files under it", () => {
    expect(pathsCollide("src/workflow/", "src/workflow/schema.ts")).toBe(true);
    expect(pathsCollide("src/workflow/schema.ts", "src/workflow")).toBe(true);
  });

  it("treats equal paths as colliding", () => {
    expect(pathsCollide("hooks/dad-joke/config.ts", "hooks/dad-joke/config.ts")).toBe(true);
  });

  it("does not collide unrelated paths", () => {
    expect(pathsCollide("hooks/dad-joke/config.ts", "skills/backlog-plan/")).toBe(false);
  });

  it("splits on segments — a raw string prefix is not a path prefix", () => {
    // "hooks/dad-joke" is a raw-string prefix of "hooks/dad-joke-2" but NOT a path prefix.
    expect(pathsCollide("hooks/dad-joke", "hooks/dad-joke-2/config.ts")).toBe(false);
  });
});

describe("referencesCollide", () => {
  it("is true when any pair of paths collides", () => {
    expect(referencesCollide(["a/", "b/c.ts"], ["x/", "b/c.ts"])).toBe(true);
    expect(referencesCollide(["a/", "b/"], ["x/", "y/"])).toBe(false);
  });
});

describe("findCollisions", () => {
  const target = { id: "DIP-7.5", references: ["skills/backlog-deliver/SKILL.md"] };

  it("returns colliding stories and excludes the target itself", () => {
    const others = [
      { id: "DIP-7.5", references: ["skills/backlog-deliver/SKILL.md"] }, // same id, ignored
      { id: "DIP-7.6", references: ["skills/backlog-deliver/"] }, // dir prefix -> collides
      { id: "DIP-7.7", references: ["skills/backlog-plan/SKILL.md"] }, // disjoint
    ];
    const hits = findCollisions(target, others);
    expect(hits.map((h) => h.id)).toEqual(["DIP-7.6"]);
  });

  it("returns empty when nothing collides", () => {
    const others = [{ id: "DIP-7.7", references: ["src/workflow/"] }];
    expect(findCollisions(target, others)).toEqual([]);
  });
});
