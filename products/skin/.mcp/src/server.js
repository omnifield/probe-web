import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

const server = new McpServer({ name: "probe-web-skin", version: "0.0.0" });

registerTools(server);

await server.connect(new StdioServerTransport());
