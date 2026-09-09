import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrowserTools } from "./browser";
import { registerContentTools } from "./content";
import { registerFeedbackTools } from "./feedback";
import { registerKitTools } from "./kit";
import { registerPresetTools } from "./presets";

export function registerTools(server: McpServer): void {
  registerKitTools(server);
  registerPresetTools(server);
  registerFeedbackTools(server);
  registerContentTools(server);
  registerBrowserTools(server);
}
