import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, `file://${root}`), "utf8"));

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

describe(".claude-plugin/plugin.json", () => {
  const plugin = readJson(".claude-plugin/plugin.json") as Record<string, unknown>;

  it("is valid JSON with a kebab-case name", () => {
    expect(typeof plugin.name).toBe("string");
    expect(plugin.name as string).toMatch(KEBAB);
  });

  it("has description, version and an author with a name", () => {
    expect(plugin.description).toBeTruthy();
    expect(plugin.version).toBeTruthy();
    expect((plugin.author as { name?: string }).name).toBeTruthy();
  });
});

describe(".claude-plugin/marketplace.json", () => {
  const market = readJson(".claude-plugin/marketplace.json") as Record<string, unknown>;
  const plugin = readJson(".claude-plugin/plugin.json") as Record<string, unknown>;

  it("has a kebab-case name and an owner name", () => {
    expect(market.name as string).toMatch(KEBAB);
    expect((market.owner as { name?: string }).name).toBeTruthy();
  });

  it("lists the root plugin via source './' matching plugin.json name", () => {
    const plugins = market.plugins as Array<Record<string, unknown>>;
    expect(Array.isArray(plugins)).toBe(true);
    const rootEntry = plugins.find((p) => p.source === "./");
    expect(rootEntry, "expected a plugin entry with source './'").toBeDefined();
    expect(rootEntry?.name).toBe(plugin.name);
  });
});
