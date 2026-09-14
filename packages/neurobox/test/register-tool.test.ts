import { describe, expect, it } from "vitest";
import { z } from "@web-core/io";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { err, ok, registerTool } from "../src/server/index.js";

async function connectedClient(register: (server: McpServer) => void): Promise<Client> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  register(server);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

describe("registerTool", () => {
  it("throws at registration when access is missing", () => {
    const server = new McpServer({ name: "test-server", version: "0.0.0" });
    expect(() =>
      registerTool(server, {
        name: "broken",
        description: "no access declared",
        handler: () => ok(),
      } as never),
    ).toThrow(/access/);
  });

  it("maps access to native readOnlyHint/destructiveHint annotations", async () => {
    const client = await connectedClient((server) => {
      registerTool(server, { name: "peek", description: "reads", access: "read", handler: () => ok() });
      registerTool(server, { name: "nuke", description: "destroys", access: "destructive", handler: () => ok() });
      registerTool(server, { name: "save", description: "writes", access: "write", handler: () => ok() });
    });

    const { tools } = await client.listTools();
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

    expect(byName["peek"]?.annotations?.readOnlyHint).toBe(true);
    expect(byName["peek"]?.annotations?.destructiveHint).toBe(false);
    expect(byName["nuke"]?.annotations?.destructiveHint).toBe(true);
    expect(byName["nuke"]?.annotations?.readOnlyHint).toBe(false);
    expect(byName["save"]?.annotations?.readOnlyHint).toBe(false);
    expect(byName["save"]?.annotations?.destructiveHint).toBe(false);
  });

  it("round-trips input/output as real Zod schemas through ok()", async () => {
    const client = await connectedClient((server) => {
      registerTool(server, {
        name: "greet",
        description: "greets by name",
        access: "read",
        input: z.object({ name: z.string() }),
        output: z.object({ greeting: z.string() }),
        handler: ({ name }) => ok({ greeting: `hello ${name}` }),
      });
    });

    const result = await client.callTool({ name: "greet", arguments: { name: "world" } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toEqual({ greeting: "hello world" });
  });

  it("err() surfaces isError: true, not a silent ok:false", async () => {
    const client = await connectedClient((server) => {
      registerTool(server, { name: "fail", description: "always fails", access: "read", handler: () => err("nope") });
    });

    const result = await client.callTool({ name: "fail", arguments: {} });
    expect(result.isError).toBe(true);
  });
});

describe("ok/err", () => {
  it("ok() with no value is a plain success", () => {
    expect(ok()).toEqual({ content: [{ type: "text", text: "ok" }], isError: false });
  });

  it("ok() with a primitive does not attach structuredContent", () => {
    const result = ok(42);
    expect(result.isError).toBe(false);
    expect(result).not.toHaveProperty("structuredContent");
  });

  it("ok() with an object attaches it as structuredContent", () => {
    const result = ok({ a: 1 });
    expect(result.structuredContent).toEqual({ a: 1 });
  });
});
