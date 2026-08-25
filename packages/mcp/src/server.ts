// Обвязка поверх официального MCP SDK — транспорт Streamable HTTP, каркас без знания о продукте.
//
// `createMcpServer` отдаёт `RequestListener`, а не сам поднимает `http.createServer`: продукт
// решает, на каком порту слушать и под каким путём смонтировать эндпоинт (или встроить в уже
// работающий у себя сервер) — пакет об этом ничего не решает (ТЗ `PWEB-117`, пункт 1).
//
// Режим — STATELESS (`sessionIdGenerator: undefined`): на каждый запрос заводится СВОЙ
// `McpServer` и своя `StreamableHTTPServerTransport`. Это канонический паттерн самого SDK для
// «простых API-серверов без отслеживания сессии» — пример `simpleStatelessStreamableHttp.ts` в
// поставке `@modelcontextprotocol/sdk` (сверено 2026-08-25, v1.30.0: `npm view
// @modelcontextprotocol/sdk dist-tags`). Список инструментов фиксирован при вызове
// `createMcpServer` и не меняется между запросами — держать сессию нечем и незачем.

import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { trace } from "./trace.js";
import type { CreateMcpServerOptions } from "./types.js";

/**
 * Собирает MCP-сервер и отдаёт готовый обработчик HTTP-запросов.
 *
 * @param options имя/версия сервера и плоский список инструментов (фреймворковые + продуктовые)
 * @returns `RequestListener` — монтируется в `http.createServer` продукта под любым путём
 */
export function createMcpServer(options: CreateMcpServerOptions): RequestListener {
  const { name, tools, version = "0.0.0" } = options;

  return async (req: IncomingMessage, res: ServerResponse) => {
    const done = trace("request");
    const server = new McpServer({ name, version });

    for (const tool of tools) {
      server.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (args) => {
          const doneTool = trace("tool");
          try {
            return await tool.handler(args);
          } finally {
            doneTool(tool.name);
          }
        },
      );
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on("close", () => {
      transport.close();
      server.close();
      done(`→ ${res.statusCode}`);
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      // Неожиданная поломка обвязки, а не отказ инструмента по делу (тот приходит через
      // `CallToolResult.isError` и до сюда не долетает). Наружу — тем же конвертом JSON-RPC,
      // каким отвечает сам протокол на прочие ошибки.
      console.error("[probe-web-mcp] сбой запроса:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(
          JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null }),
        );
      } else {
        res.end();
      }
    }
  };
}
