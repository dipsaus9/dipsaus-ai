import { createHash } from "node:crypto";
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** Every mutating/grading entry point goes through this guard: apply mode
 * only ever operates under the OS tmpdir. */
export function assertSandboxPath(candidate: string): string {
  const real = realpathSync(candidate);
  const tmpRoot = realpathSync(os.tmpdir());
  if (real !== tmpRoot && !real.startsWith(tmpRoot + path.sep)) {
    throw new Error(`refusing to touch ${candidate}: outside the sandbox root ${tmpRoot}`);
  }
  return real;
}

/** Content hash of every file in a directory tree — proves originals untouched. */
export function hashDir(dir: string): string {
  const hash = createHash("sha256");
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        hash.update(entry.name);
        hash.update(readFileSync(full));
      }
    }
  };
  walk(dir);
  return hash.digest("hex");
}

const SANDBOX_TSCONFIG = {
  compilerOptions: {
    target: "ES2022",
    module: "ESNext",
    moduleResolution: "bundler",
    lib: ["ES2022", "DOM", "DOM.Iterable"],
    jsx: "react-jsx",
    types: ["bun", "node"],
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    skipLibCheck: true,
    verbatimModuleSyntax: true,
  },
  include: ["**/*.ts", "**/*.tsx"],
};

const SANDBOX_VITEST_CONFIG = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
  },
});
`;

export interface Sandbox {
  dir: string;
  /** pristine copy of the behavior test, restored before grading */
  pristineTest: string | null;
}

/**
 * Copy a fixture directory into a fresh tmpdir sandbox. expected.json is
 * excluded (labels must not leak to the model). The repo's node_modules is
 * symlinked in and standalone tsconfig/vitest configs are generated so tsc
 * and vitest resolve everything from inside the tmpdir.
 */
export function createSandbox(fixtureDir: string): Sandbox {
  const dir = mkdtempSync(path.join(os.tmpdir(), "dipsaus-eval-apply-"));
  assertSandboxPath(dir);
  cpSync(fixtureDir, dir, {
    recursive: true,
    filter: (source) => path.basename(source) !== "expected.json",
  });
  symlinkSync(path.join(REPO_ROOT, "node_modules"), path.join(dir, "node_modules"));
  writeFileSync(path.join(dir, "tsconfig.json"), `${JSON.stringify(SANDBOX_TSCONFIG, null, 2)}\n`);
  writeFileSync(path.join(dir, "vitest.config.mts"), SANDBOX_VITEST_CONFIG);
  const testPath = path.join(dir, "behavior.test.tsx");
  let pristineTest: string | null = null;
  try {
    pristineTest = readFileSync(testPath, "utf8");
  } catch {
    pristineTest = null;
  }
  return { dir, pristineTest };
}

/** Overwrite the sandbox behavior test with the pristine copy — a model that
 * edited the test cannot grade itself green. */
export function restoreBehaviorTest(sandbox: Sandbox): void {
  assertSandboxPath(sandbox.dir);
  if (sandbox.pristineTest !== null) {
    writeFileSync(path.join(sandbox.dir, "behavior.test.tsx"), sandbox.pristineTest);
  }
}

/** Source files to grade: every non-test .ts/.tsx in the sandbox tree. */
export function sandboxSourceFiles(dir: string): string[] {
  assertSandboxPath(dir);
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") {
          walk(full);
        }
      } else if (
        /\.(ts|tsx)$/.test(entry.name) &&
        !entry.name.endsWith(".test.tsx") &&
        !entry.name.endsWith(".test.ts") &&
        entry.name !== "vitest.config.mts"
      ) {
        files.push(full);
      }
    }
  };
  walk(dir);
  return files.sort((a, b) => a.localeCompare(b));
}

export function destroySandbox(sandbox: Sandbox): void {
  assertSandboxPath(sandbox.dir);
  rmSync(sandbox.dir, { recursive: true, force: true });
}
