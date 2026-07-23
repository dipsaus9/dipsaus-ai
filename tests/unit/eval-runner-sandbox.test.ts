import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertSandboxPath } from "../eval/runner/sandbox";

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
