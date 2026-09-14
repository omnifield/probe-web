import { toolDefinition as createToolDefinition } from "@tanstack/ai";
import type { SchemaInput, ToolDefinition, ToolDefinitionConfig } from "@tanstack/ai";

export type Access = "read" | "write" | "destructive";

/**
 * Слой «меха» из трёхслойного деления (architect+user, 2026-09-13): как вообще устроен тул, не
 * привязана ни к одному продуктовому пакету. `access` — та же дисциплина, что была у `registerTool`
 * (`@web-core/neurobox/server`) до переезда на `@tanstack/ai` как фундамент под тулы — не даём ей
 * потеряться. Approval-поля (`needsApproval`/`approvalSchema`) вендора здесь намеренно не
 * пробрасываются — не были частью запроса, добавлять непрошенный функционал незачем; понадобятся —
 * отдельный заход, не молчаливое расширение сегодняшнего.
 */
export type ToolDefinitionOptions<
  TInput extends SchemaInput | undefined = undefined,
  TOutput extends SchemaInput | undefined = undefined,
  TName extends string = string,
> = Omit<ToolDefinitionConfig<TInput, TOutput, TName>, "metadata" | "needsApproval" | "approvalSchema"> & {
  /** Обязателен, не опционален — та же дисциплина, что была у `registerTool`. */
  readonly access: Access;
};

/**
 * Обёртка над `@tanstack/ai`'s `toolDefinition()` — единственная разница: требует `access`, кладёт
 * его в вендорское свободное поле `metadata` (`@tanstack/ai` о нём ничего не знает и не трогает).
 * Читать `access` обратно — `accessOf()` ниже.
 */
export function toolDefinition<
  TInput extends SchemaInput | undefined = undefined,
  TOutput extends SchemaInput | undefined = undefined,
  TName extends string = string,
>(options: ToolDefinitionOptions<TInput, TOutput, TName>): ToolDefinition<TInput, TOutput, TName> {
  const { access, ...config } = options;
  return createToolDefinition({ ...config, metadata: { access } });
}

/**
 * Читает `access`, положенный `toolDefinition()` выше, с любого построенного тула
 * (`ToolDefinitionInstance`/`ServerTool`/`ClientTool`/их широкие `Any*`-варианты — все несут
 * `metadata` структурно через общий `Tool`, поэтому сигнатура не завязана на конкретное имя типа
 * вендора). Бросает, а не отдаёт `undefined` молча: тул без access не должен тихо пройти дальше в
 * MCP-регистрацию, которая его же и требует (`@web-core/neurobox/server`'s `registerTool`).
 */
export function accessOf(tool: { readonly metadata?: Record<string, unknown> }): Access {
  const access = tool.metadata?.["access"];
  if (access === "read" || access === "write" || access === "destructive") return access;
  throw new Error(
    `@web-core/neurobox/tool: missing or invalid "access" in tool metadata (got ${JSON.stringify(access)}) — was this tool built with toolDefinition() from this package?`,
  );
}
