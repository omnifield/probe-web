import { createPresetsClient, PRESET_KIND, type ContentState, type PresetRecord } from "@web-core/skin/presets";

import { PRESETS_URL } from "#/shared/api/presets";

// Свой клиент, не общий синглтон: этот файл ничего не знает про componentInfo и наоборот, оба
// ходят к одной службе независимо друг от друга. Общий у них ровно адрес — `shared/api/presets`.
const presets = createPresetsClient({ url: PRESETS_URL });

/** Сохранённые content-записи ИМЕННО этого компонента — служба сама по component не фильтрует
 *  (`state` для неё непрозрачен), фильтр — на клиенте, тот же приём, каким это уже делает
 *  `list_content` на стороне MCP (`apps/skin/.mcp`). */
export async function listContentFor(component: string): Promise<PresetRecord<ContentState>[]> {
  const records = await presets.list(PRESET_KIND.content);
  return records.filter((record) => record.state.component === component);
}

/** Одна content-запись по машинному имени — источник данных `/embed/...?content=<name>`, аналог
 *  MCP-инструмента `get_content`, только с фронта. */
export async function getContentByName(name: string): Promise<PresetRecord<ContentState> | undefined> {
  return presets.get(PRESET_KIND.content, name);
}
