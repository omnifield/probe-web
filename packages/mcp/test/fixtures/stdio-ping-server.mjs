// Реальный, независимый от @web-core/mcp stdio-сервер — только для теста stdioPeer в
// peer.test.ts. Не через createServer(../src/transport) нарочно: фикстура должна быть запускаема
// голым `node` как отдельный процесс, не завязанным на то, собран ли сейчас dist пакета.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "stdio-ping-fixture", version: "0.0.0" });

server.registerTool(
  "ping",
  { description: "pong" },
  async () => ({ content: [{ type: "text", text: "pong" }], isError: false }),
);

// pid в ответе — единственный способ теста доказать "один процесс на весь peer", не "новый на
// каждый вызов": если бы stdioPeer запускал процесс заново на каждый callTool, pid бы менялся.
server.registerTool(
  "whoami",
  { description: "pid этого процесса" },
  async () => ({ content: [{ type: "text", text: String(process.pid) }], isError: false }),
);

// Доказывает, что доходит до процесса, а что — нет: по умолчанию SDK даёт обрезанный набор
// (PATH/HOME/...), не весь process.env запускающего — см. peer.test.ts, env passthrough.
server.registerTool(
  "env-probe",
  { description: "значение своей переменной окружения, если она вообще долетела" },
  async () => ({ content: [{ type: "text", text: String(process.env["STDIO_PEER_TEST_VAR"] ?? "") }], isError: false }),
);

await server.connect(new StdioServerTransport());
