import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerContentTools } from "../src/tools/content";

async function connectedClient(): Promise<Client> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerContentTools(server);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
}

describe("save_content input schema", () => {
  it("advertises data as an object, not an untyped field", async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    const saveContent = tools.find((t) => t.name === "save_content");

    expect(saveContent).toBeDefined();
    const dataSchema = (
      saveContent?.inputSchema.properties as Record<
        string,
        { type?: string }
      >
    ).data;

    // Регрессия: z.unknown() рендерится без "type" вообще, из-за чего MCP-клиенты
    // не понимают, что сюда нужен объект, и шлют data строкой.
    expect(dataSchema.type).toBe("object");
  });
});
