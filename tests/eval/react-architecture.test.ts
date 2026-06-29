import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { judgeReport } from "./judge";
import { isCliReady, runCli } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const PASS_THRESHOLD = 80;

const FIXTURES = [
  { file: "fixtures/react/god-component.tsx", label: "SRP + state/data" },
  { file: "fixtures/react/config-soup-card.tsx", label: "compound components" },
  { file: "fixtures/react/prop-drilling.tsx", label: "prop drilling" },
  { file: "fixtures/react/cross-feature-coupling.tsx", label: "feature boundaries" },
] as const;

/** Run the skill in report mode on a fixture and return its raw report text. */
function reviewFixture(fixturePath: string): string {
  const r = runCli(`/react-architecture review ${fixturePath}`, {
    cwd: repoRoot,
    pluginDir: repoRoot,
    addDir: [repoRoot],
    allowedTools: ["Read"],
  });
  return r.result;
}

let ready = false;
beforeAll(() => {
  // One probe confirms the CLI is installed AND logged in. If not, every case skips.
  ready = isCliReady(repoRoot);
}, 120_000);

describe("react-architecture report-mode eval", () => {
  for (const fx of FIXTURES) {
    it(`scores >= ${PASS_THRESHOLD}: ${fx.label}`, (ctx) => {
      if (!ready) {
        ctx.skip();
        return;
      }
      const report = reviewFixture(fx.file);
      const score = judgeReport(basename(fx.file), report);
      // Surface the score so a borderline run is visible.
      console.log(`[eval] ${fx.file} -> ${score}/100`);
      expect(score).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    });
  }
});
