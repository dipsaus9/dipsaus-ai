import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { refactor } from "./apply";
import { binaryCheck } from "./check";
import { isCliReady } from "./runner";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

// "My liking", defined in the test: per fixture, the binary rules the refactor must satisfy.
// A separate AI context answers each PASS/FAIL. The skill's refactor must pass all of its
// rules AND do no worse than the no-skill baseline refactor.
const CASES: { file: string; label: string; rules: string[] }[] = [
  {
    file: "fixtures/react/prop-drilling.tsx",
    label: "prop drilling",
    rules: [
      "`user` is no longer passed through intermediate components (Layout, Sidebar) that don't use it — prop-drilling is eliminated.",
      "The fix uses composition/children (slots) rather than only introducing React Context.",
    ],
  },
  {
    file: "fixtures/react/cross-feature-coupling.tsx",
    label: "feature boundaries",
    rules: [
      "The profile component no longer deep-imports another feature's internals; it depends on a public API or receives data via props.",
      "Invoice/tax domain logic is no longer computed inside the profile component.",
    ],
  },
  {
    file: "fixtures/react/config-soup-card.tsx",
    label: "compound components",
    rules: [
      "Card exposes a compound API (e.g. Card.Header/Card.Body/Card.Footer or children/slots) instead of boolean configuration props such as showHeader/hideFooter.",
    ],
  },
  {
    file: "fixtures/react/god-component.tsx",
    label: "SRP + state/data",
    rules: [
      "Derived values (e.g. a full name) are computed during render — no useEffect+useState mirroring of derived state.",
      "Data fetching is not done with manual useEffect+useState inside the component (moved to a hook/query/loader).",
    ],
  },
];

let ready = false;
beforeAll(() => {
  ready = isCliReady(repoRoot);
}, 120_000);

describe("react-architecture apply-mode eval (skill vs baseline)", () => {
  for (const c of CASES) {
    it(`skill refactor satisfies all rules and beats baseline: ${c.label}`, (ctx) => {
      if (!ready) return ctx.skip();

      const skillCode = refactor(c.file, true);
      const baselineCode = refactor(c.file, false);

      const skill = c.rules.map((r) => ({ r, ...binaryCheck(skillCode, r) }));
      const baseline = c.rules.map((r) => ({ r, ...binaryCheck(baselineCode, r) }));

      const skillPass = skill.filter((x) => x.pass).length;
      const basePass = baseline.filter((x) => x.pass).length;
      console.log(
        `[eval] ${c.file} skill=${skillPass}/${c.rules.length} baseline=${basePass}/${c.rules.length}`,
      );
      for (const x of skill) if (!x.pass) console.log(`  skill FAIL: ${x.reason.split("\n")[0]}`);

      // Skill must satisfy every rule, and be no worse than the no-skill baseline.
      expect(skillPass).toBe(c.rules.length);
      expect(skillPass).toBeGreaterThanOrEqual(basePass);
    });
  }
});
