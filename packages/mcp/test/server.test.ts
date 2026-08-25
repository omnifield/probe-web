// Гейт ТЗ (PWEB-117, п.4): живой сервер отвечает на tools/list и tools/call по протоколу.
//
// Настоящий клиент SDK по настоящему HTTP — ни разу не мок протокола. Один фреймворковый
// инструмент (`listComponentsTool` — читает реальный паспорт кита из `packages/ui`) и один
// фиктивный продуктовый (демонстрирует конкатенацию массивов из п.3 ТЗ, без наследования и без
// переопределения фреймворкового).

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMcpServer, defineMcpTool, listComponentsTool } from "../src/index.js";

const fakeProductTool = defineMcpTool({
  name: "fake_product_echo",
  description: "Фиктивный продуктовый инструмент — доказывает конкатенацию со своим списком.",
  inputSchema: { text: z.string() },
  handler: ({ text }) => ({ content: [{ type: "text", text: `echo: ${text}` }] }),
});

describe("createMcpServer — интеграция по протоколу", () => {
  let server: ReturnType<typeof createServer>;
  let origin: string;
  let client: Client;

  beforeEach(async () => {
    const listener = createMcpServer({
      name: "gate-test-server",
      tools: [listComponentsTool, fakeProductTool],
    });
    server = createServer(listener);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    origin = `http://127.0.0.1:${port}`;

    client = new Client({ name: "gate-test-client", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL("/mcp", origin));
    await client.connect(transport);
  });

  afterEach(async () => {
    await client.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("tools/list отдаёт и фреймворковый, и продуктовый инструмент", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();
    expect(names).toEqual(["fake_product_echo", "list_components"]);
  });

  it("tools/call реально вызывает фреймворковый инструмент — читает паспорт кита", async () => {
    const result = await client.callTool({ name: "list_components", arguments: {} });
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text: string }[];
    const payload = JSON.parse(content[0]!.text) as { components: string[] };
    expect(payload.components).toContain("button");
  });

  it("tools/call реально вызывает продуктовый инструмент — свой, не подменённый фреймворком", async () => {
    const result = await client.callTool({ name: "fake_product_echo", arguments: { text: "привет" } });
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text: string }[];
    expect(content[0]!.text).toBe("echo: привет");
  });
});
