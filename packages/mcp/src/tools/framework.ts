// Фреймворковый набор — продукт включает ПО ЖЕЛАНИЮ, не автоматически (ТЗ `PWEB-117`, п.2).
//
// `createMcpServer` сам этот список никуда не подмешивает: продукт зовёт `frameworkTools(...)`
// и кладёт результат в СВОЙ массив `tools` рядом со своими инструментами — конкатенацией, без
// наследования и переопределения (п.3).

import { getComponentPassportTool, listComponentsTool } from "./components.js";
import { presetsTools, type PresetsToolsOptions } from "./presets.js";
import type { McpToolDefinition } from "../types.js";

export { getComponentPassportTool, listComponentsTool } from "./components.js";
export { presetsTools, type PresetsToolsOptions } from "./presets.js";

/**
 * Весь фреймворковый набор одним вызовом: паспорт кита + пресеты.
 *
 * @param options адрес службы пресетов — обязателен, инструменты пресетов без него не работают
 */
export function frameworkTools(options: PresetsToolsOptions): McpToolDefinition[] {
  return [listComponentsTool, getComponentPassportTool, ...presetsTools(options)];
}
