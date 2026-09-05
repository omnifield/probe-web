import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema, SchemaOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export type Access = "read" | "write" | "destructive";

export interface ToolDefinition<Input extends AnySchema | undefined = undefined> {
  readonly name: string;
  readonly title?: string;
  readonly description: string;
  readonly access: Access;
  readonly idempotent?: boolean;
  readonly openWorld?: boolean;
  readonly input?: Input;
  readonly output?: AnySchema;
  readonly handler: Input extends AnySchema
    ? (args: SchemaOutput<Input>) => CallToolResult | Promise<CallToolResult>
    : () => CallToolResult | Promise<CallToolResult>;
}

type RawRegisterToolConfig = {
  title?: string;
  description?: string;
  inputSchema?: AnySchema;
  outputSchema?: AnySchema;
  annotations?: ToolAnnotations;
};

type RawRegisterTool = (
  name: string,
  config: RawRegisterToolConfig,
  handler: (args: unknown) => CallToolResult | Promise<CallToolResult>,
) => unknown;

export function registerTool<Input extends AnySchema | undefined = undefined>(
  server: McpServer,
  definition: ToolDefinition<Input>,
): void {
  if (!definition.access) {
    throw new Error(
      `@web-core/mcp: tool "${definition.name}" must declare access ("read" | "write" | "destructive")`,
    );
  }

  const annotations: ToolAnnotations = {
    title: definition.title,
    readOnlyHint: definition.access === "read",
    destructiveHint: definition.access === "destructive",
    idempotentHint: definition.idempotent,
    openWorldHint: definition.openWorld,
  };

  const rawRegisterTool = server.registerTool.bind(server) as unknown as RawRegisterTool;
  rawRegisterTool(
    definition.name,
    {
      title: definition.title,
      description: definition.description,
      inputSchema: definition.input,
      outputSchema: definition.output,
      annotations,
    },
    (args: unknown) => (definition.handler as (args: unknown) => CallToolResult | Promise<CallToolResult>)(args),
  );
}

export function ok(value?: unknown): CallToolResult {
  const text = value === undefined ? "ok" : JSON.stringify(value, null, 2);
  const structuredContent =
    value !== undefined && typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;

  return {
    content: [{ type: "text", text }],
    ...(structuredContent !== undefined ? { structuredContent } : {}),
    isError: false,
  };
}

export function err(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
