import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards that the umbrella plugin actually exposes every component on disk.
// Claude Code auto-discovers skills/ and .mcp.json, so the manifest stays lean;
// this test is what keeps the "listing" honest as new skills are added.

const root = fileURLToPath(new URL("../../", import.meta.url));
const at = (rel: string): string => fileURLToPath(new URL(rel, `file://${root}`));

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const frontmatter = (md: string): Record<string, string> => {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  expect(match, "expected a frontmatter block").toBeTruthy();
  const out: Record<string, string> = {};
  for (const line of match![1]!.split("\n")) {
    const kv = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]!] = kv[2]!.trim();
  }
  return out;
};

describe("skills/ auto-discovery", () => {
  const skillDirs = readdirSync(at("skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  it("has at least one skill", () => {
    expect(skillDirs.length).toBeGreaterThan(0);
  });

  it.each(skillDirs)("skills/%s has a valid, discoverable SKILL.md", (dir) => {
    const path = at(`skills/${dir}/SKILL.md`);
    expect(existsSync(path), `missing SKILL.md for ${dir}`).toBe(true);
    const fm = frontmatter(readFileSync(path, "utf8"));
    expect(fm.name, `${dir}: frontmatter name required`).toMatch(KEBAB);
    expect(fm.name, `${dir}: frontmatter name must match folder`).toBe(dir);
    expect(fm.description, `${dir}: description required`).toBeTruthy();
  });
});

describe(".mcp.json wiring", () => {
  const cfg = JSON.parse(readFileSync(at(".mcp.json"), "utf8")) as {
    mcpServers: Record<string, { command: string; args?: string[] }>;
  };

  it("declares at least one server, each with a command", () => {
    const servers = Object.entries(cfg.mcpServers);
    expect(servers.length).toBeGreaterThan(0);
    for (const [name, s] of servers) {
      expect(name).toMatch(KEBAB);
      expect(s.command, `${name}: command required`).toBeTruthy();
    }
  });
});
