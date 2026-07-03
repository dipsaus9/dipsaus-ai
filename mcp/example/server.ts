#!/usr/bin/env bun
/**
 * Example MCP server — a minimal stdio "hello" tool.
 *
 * Purpose: boilerplate specimen proving the MCP layer of the plugin works and
 * is testable. No domain logic. Ships as TS run directly by bun (no build step);
 * registered via the root .mcp.json.
 *
 * Exposes one tool, `hello`, which greets an optional `name` (defaults to "world").
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

export const SERVER_INFO = { name: 'dipsaus-example', version: '0.1.0' } as const

/** Pure greeting used by the tool — exported so unit tests can assert it directly. */
export function greet(name?: string): string {
  return `Hello, ${name?.trim() || 'world'}!`
}

/** Build a configured server instance. Kept separate from transport wiring for testing. */
export function createServer(): McpServer {
  const server = new McpServer(SERVER_INFO)

  server.registerTool(
    'hello',
    {
      title: 'Hello',
      description: 'Return a friendly greeting for the given name.',
      inputSchema: { name: z.string().optional().describe('Who to greet; defaults to "world".') },
    },
    ({ name }) => ({ content: [{ type: 'text', text: greet(name) }] }),
  )

  return server
}

/** Start the server over stdio. Only runs when executed directly, not when imported by tests. */
async function main(): Promise<void> {
  const server = createServer()
  await server.connect(new StdioServerTransport())
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error('[dipsaus-example] fatal:', error)
    process.exit(1)
  })
}
