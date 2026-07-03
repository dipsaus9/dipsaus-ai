import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { greet } from "../../mcp/example/server.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const serverPath = fileURLToPath(new URL("../../mcp/example/server.ts", import.meta.url));

const textOf = (result: unknown): string =>
  ((result as { content: Array<{ text: string }> }).content)[0]!.text;

describe("greet()", () => {
  it("defaults to world and trims names", () => {
    expect(greet()).toBe("Hello, world!");
    expect(greet("  ")).toBe("Hello, world!");
    expect(greet("Dennis")).toBe("Hello, Dennis!");
  });
});

describe("root .mcp.json", () => {
  const cfg = JSON.parse(readFileSync(new URL(".mcp.json", `file://${root}`), "utf8")) as {
    mcpServers: Record<string, { command: string; args: string[] }>;
  };

  it("registers the dipsaus-example server", () => {
    const server = cfg.mcpServers["dipsaus-example"];
    expect(server, "expected a dipsaus-example entry").toBeDefined();
    expect(server?.command).toBe("bun");
  });

  it("points at an entry file that exists on disk", () => {
    const arg = cfg.mcpServers["dipsaus-example"]!.args[0]!;
    const resolved = arg.replace("${CLAUDE_PLUGIN_ROOT}", root.replace(/\/$/, ""));
    expect(existsSync(resolved), `entry file missing: ${resolved}`).toBe(true);
  });
});

describe("example MCP server over stdio", () => {
  const client = new Client({ name: "dipsaus-example-test", version: "0.0.0" });
  // Launch with `bun` (matches .mcp.json) so the TS entry runs without a build step.
  const transport = new StdioClientTransport({ command: "bun", args: [serverPath] });

  beforeAll(async () => {
    await client.connect(transport);
  });
  afterAll(async () => {
    await client.close();
  });

  it("exposes exactly the hello tool", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(["hello"]);
  });

  it("greets the default and a named caller", async () => {
    expect(textOf(await client.callTool({ name: "hello", arguments: {} }))).toBe("Hello, world!");
    expect(textOf(await client.callTool({ name: "hello", arguments: { name: "Dennis" } }))).toBe(
      "Hello, Dennis!",
    );
  });
});
