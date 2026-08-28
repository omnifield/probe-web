// Поверхность зоны `mcp` — тонкая обвязка поверх официального MCP SDK (`PWEB-117`).
//
// Один вход, как и у соседних пакетов фреймворка: подпутей заводим, когда появится потребитель,
// которому корневого не хватило (то же правило, что у `packages/ui`).

export { createMcpServer } from "./server.js";
export { defineMcpTool } from "./types.js";
export type { CreateMcpServerOptions, McpToolDefinition, ToolArgs, ToolInputShape } from "./types.js";

export {
  frameworkTools,
  getComponentPassportTool,
  listComponentsTool,
  presetsTools,
  type PresetsToolsOptions,
} from "./tools/framework.js";
