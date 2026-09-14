import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerKitTools } from "../src/tools/kit";

async function connectedClient(): Promise<Client> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerKitTools(server);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

async function readJson(result: Awaited<ReturnType<Client["callTool"]>>) {
  const first = (result.content as { type: string; text?: string }[])[0];
  if (!first || first.type !== "text" || first.text === undefined) {
    throw new Error(`unexpected result shape: ${JSON.stringify(result)}`);
  }
  return JSON.parse(first.text);
}

describe("list_docs", () => {
  it("wraps in {items} and returns real topics/titles from docs/*.md", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "list_docs", arguments: {} }));

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.map((d: { topic: string }) => d.topic)).toContain("author");
    for (const doc of body.items) {
      expect(typeof doc.topic).toBe("string");
      expect(typeof doc.title).toBe("string");
    }
  });
});

describe("get_doc", () => {
  it("returns raw markdown for a real topic", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "get_doc", arguments: { topic: "author" } });
    const first = (result.content as { type: string; text?: string }[])[0];

    expect(result.isError).toBe(false);
    expect(first?.text).toContain("author");
  });

  it("errors on an unknown topic instead of returning undefined silently", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "get_doc", arguments: { topic: "no-such-topic" } });

    expect(result.isError).toBe(true);
  });
});

describe("list_components", () => {
  it("returns real kit cards and respects group/footprint filters", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "list_components", arguments: { limit: 5 } }));

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    const card = body.items[0];
    expect(typeof card.component).toBe("string");
    expect(typeof card.group).toBe("string");
    expect(typeof card.package).toBe("string");
  });

  it("errors isError:false with an empty page on an unknown group, not a protocol error", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "list_components", arguments: { group: "no-such-group" } });

    expect(result.isError).toBe(true);
  });
});

describe("get_passport", () => {
  it("returns parts/settings for a real component", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "get_passport", arguments: { component: "accordion" } }));

    expect(body.component).toBe("accordion");
    expect(Array.isArray(body.parts)).toBe(true);
    expect(body.parts.length).toBeGreaterThan(0);
  });

  it("errors on an unknown component", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "get_passport", arguments: { component: "no-such-component" } });

    expect(result.isError).toBe(true);
  });
});

describe("get_assemblies", () => {
  it("without name returns the {name, means} list", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "get_assemblies", arguments: { component: "accordion" } }));

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(typeof body[0].name).toBe("string");
  });

  it("with name returns one full assembly tree", async () => {
    const client = await connectedClient();
    const list = await readJson(await client.callTool({ name: "get_assemblies", arguments: { component: "accordion" } }));
    const name = list[0].name;

    const body = await readJson(
      await client.callTool({ name: "get_assemblies", arguments: { component: "accordion", name } }),
    );
    expect(body.name).toBe(name);
  });

  it("errors on an unknown assembly name", async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: "get_assemblies",
      arguments: { component: "accordion", name: "no-such-assembly" },
    });

    expect(result.isError).toBe(true);
  });
});

describe("get_io_schema", () => {
  it("returns {input, output} JSON Schema for a real component", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "get_io_schema", arguments: { component: "accordion" } }));

    expect(body).toHaveProperty("input");
    expect(body).toHaveProperty("output");
  });
});
