import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema, SchemaOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { CallToolResult, IsomorphicHeaders, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export type Access = "read" | "write" | "destructive";

/**
 * То, что реально пришло с запросом, помимо аргументов — заголовки транспорта (пусто на stdio,
 * реальные на HTTP — `extra.requestInfo.headers` у SDK) и id сессии. НЕ весь `RequestHandlerExtra`
 * SDK (там ещё signal/sendNotification/taskStore — служебное для транспорта, не для хендлера тула).
 */
export interface ToolContext {
  readonly headers: IsomorphicHeaders;
  readonly sessionId?: string;
}

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
    ? (args: SchemaOutput<Input>, context: ToolContext) => CallToolResult | Promise<CallToolResult>
    : (context: ToolContext) => CallToolResult | Promise<CallToolResult>;
}

type RawRegisterToolConfig = {
  title?: string;
  description?: string;
  inputSchema?: AnySchema;
  outputSchema?: AnySchema;
  annotations?: ToolAnnotations;
};

// Форма ровно та, которую реально шлёт SDK (server/mcp.js's executeToolHandler): при наличии
// inputSchema — handler(args, extra), без неё — handler(extra) ОДНИМ аргументом. Различать по
// definition.input, не пытаться скрыть за одной сигнатурой — SDK сама так ветвится, не наша выдумка.
interface RawExtra {
  readonly requestInfo?: { readonly headers?: IsomorphicHeaders };
  readonly sessionId?: string;
}

type RawRegisterTool = (
  name: string,
  config: RawRegisterToolConfig,
  handler: (a: unknown, b?: unknown) => CallToolResult | Promise<CallToolResult>,
) => unknown;

function contextOf(extra: RawExtra): ToolContext {
  return { headers: extra.requestInfo?.headers ?? {}, sessionId: extra.sessionId };
}

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
    definition.input
      ? (args: unknown, extra?: unknown) =>
          (definition.handler as (args: unknown, context: ToolContext) => CallToolResult | Promise<CallToolResult>)(
            args,
            contextOf((extra ?? {}) as RawExtra),
          )
      : (extra: unknown) =>
          (definition.handler as (context: ToolContext) => CallToolResult | Promise<CallToolResult>)(
            contextOf(extra as RawExtra),
          ),
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
