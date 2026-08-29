// Форма ОДНОГО инструмента — то, чем регистрируется и фреймворковый инструмент, и предметный
// инструмент продукта. Одна форма, а не две: `createMcpServer` складывает их конкатенацией
// массивов (`PWEB-117`), и складывать разнородное было бы нечем.

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";

/**
 * Схема входа инструмента — объект именованных Zod-схем, как их принимает
 * `McpServer.registerTool` (та же форма, что и у SDK: пакет её не переизобретает).
 */
export type ToolInputShape = Record<string, z.ZodType>;

/** Разобранные аргументы вызова — выведены из `ToolInputShape` тем же способом, что у SDK. */
export type ToolArgs<Shape extends ToolInputShape> = { [K in keyof Shape]: z.infer<Shape[K]> };

/**
 * Одно MCP tool-определение: имя, описание, схема входа и обработчик.
 *
 * Обработчик отдаёт `CallToolResult` — РЕАЛЬНУЮ форму протокола, а не собственный конверт:
 * «тонкая обвязка» не прячет SDK за своим форматом ответа.
 *
 * Без параметра типа: массив `tools` у `createMcpServer` — список РАЗНЫХ инструментов, и у
 * обработчика с разной схемой входа параметр функции контравариантен — типизированный по
 * конкретной `Shape` элемент не встал бы в общий массив. Полную типизацию обработчика по его
 * собственной схеме даёт `defineMcpTool`; хранится и регистрируется уже стёртая форма.
 */
export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ToolInputShape;
  readonly handler: (args: Record<string, unknown>) => CallToolResult | Promise<CallToolResult>;
}

/**
 * Объявляет один инструмент с выводом типа аргументов из его же `inputSchema`.
 *
 * Стирание до `McpToolDefinition` безопасно: `createMcpServer` зовёт `handler` ровно с теми
 * аргументами, что разобрал `inputSchema` этого же инструмента (SDK validates ЭТИМ же объектом
 * при `registerTool`) — разойтись схеме с собой нечем.
 */
export function defineMcpTool<Shape extends ToolInputShape>(tool: {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Shape;
  readonly handler: (args: ToolArgs<Shape>) => CallToolResult | Promise<CallToolResult>;
}): McpToolDefinition {
  return tool as unknown as McpToolDefinition;
}

/** Параметры `createMcpServer` — имя/версия сервера и плоский список инструментов. */
export interface CreateMcpServerOptions {
  readonly name: string;
  readonly version?: string;
  /** Плоский список: фреймворковые и продуктовые инструменты вперемешку, без разбора чей. */
  readonly tools: readonly McpToolDefinition[];
}
