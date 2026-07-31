import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertSandboxPath,
  createSandbox,
  destroySandbox,
  isSandboxExcluded,
  snapshotSandbox,
  type Sandbox,
} from "../eval/runner/sandbox";

describe("assertSandboxPath", () => {
  it("accepts a path under the OS tmpdir", () => {
    expect(assertSandboxPath(os.tmpdir())).toBeDefined();
  });

  it("refuses the repo tree and other paths outside tmpdir", () => {
    const repoPath = path.resolve(import.meta.dirname, "..");
    expect(() => assertSandboxPath(repoPath)).toThrow(/outside the sandbox root/);
    expect(() => assertSandboxPath(os.homedir())).toThrow(/outside the sandbox root/);
  });
});

describe("isSandboxExcluded", () => {
  it("excludes the labels, the Good twin and island-only tests", () => {
    expect(isSandboxExcluded("expected.json")).toBe(true);
    expect(isSandboxExcluded("Good.tsx")).toBe(true);
    expect(isSandboxExcluded("Good")).toBe(true);
    expect(isSandboxExcluded("good.test.tsx")).toBe(true);
    expect(isSandboxExcluded("parity.test.ts")).toBe(true);
  });

  it("keeps product code and the behavior test", () => {
    expect(isSandboxExcluded("Bad.tsx")).toBe(false);
    expect(isSandboxExcluded("Demo.tsx")).toBe(false);
    expect(isSandboxExcluded("behavior.test.tsx")).toBe(false);
    expect(isSandboxExcluded("index.ts")).toBe(false);
  });
});

describe("createSandbox / snapshotSandbox", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  });

  function makeFixtureDir(): string {
    const dir = mkdtempSync(path.join(os.tmpdir(), "dipsaus-fixture-"));
    cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
    writeFileSync(path.join(dir, "Bad.tsx"), "export const Bad = 1;\n");
    writeFileSync(path.join(dir, "Good.tsx"), "export const Good = 1;\n");
    writeFileSync(path.join(dir, "behavior.test.tsx"), "// pinned\n");
    writeFileSync(path.join(dir, "good.test.tsx"), "// island-only\n");
    writeFileSync(path.join(dir, "expected.json"), "{}\n");
    mkdirSync(path.join(dir, "Good"));
    writeFileSync(path.join(dir, "Good", "Part.tsx"), "export const Part = 1;\n");
    return dir;
  }

  function makeSandbox(): Sandbox {
    const sandbox = createSandbox(makeFixtureDir());
    cleanups.push(() => destroySandbox(sandbox));
    return sandbox;
  }

  it("copies the fixture without labels, Good twin or island-only tests", () => {
    const sandbox = makeSandbox();
    expect(existsSync(path.join(sandbox.dir, "Bad.tsx"))).toBe(true);
    expect(existsSync(path.join(sandbox.dir, "behavior.test.tsx"))).toBe(true);
    expect(existsSync(path.join(sandbox.dir, "expected.json"))).toBe(false);
    expect(existsSync(path.join(sandbox.dir, "Good.tsx"))).toBe(false);
    expect(existsSync(path.join(sandbox.dir, "Good"))).toBe(false);
    expect(existsSync(path.join(sandbox.dir, "good.test.tsx"))).toBe(false);
  });

  it("snapshots the sandbox without node_modules or generated configs", () => {
    const sandbox = makeSandbox();
    const dest = mkdtempSync(path.join(os.tmpdir(), "dipsaus-artifact-"));
    cleanups.push(() => rmSync(dest, { recursive: true, force: true }));
    snapshotSandbox(sandbox, dest);
    expect(existsSync(path.join(dest, "Bad.tsx"))).toBe(true);
    expect(existsSync(path.join(dest, "behavior.test.tsx"))).toBe(true);
    expect(existsSync(path.join(dest, "node_modules"))).toBe(false);
    expect(existsSync(path.join(dest, "tsconfig.json"))).toBe(false);
    expect(existsSync(path.join(dest, "vitest.config.mts"))).toBe(false);
  });
});
