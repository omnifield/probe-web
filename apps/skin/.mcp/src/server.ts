import { createServer } from "@web-core/mcp/transport";
import { registerTools } from "./tools";

const transport = process.env["SKIN_MCP_TRANSPORT"] === "http" ? "http" : "stdio";
const port = Number(process.env["PORT"] ?? 3000);

const server = createServer({ name: "web-core-skin", version: "0.0.0", transport });

registerTools(server);

await server.listen(port);
