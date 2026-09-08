import { createPresetsClient, PRESET_KIND, type ContentState, type PresetRecord } from "@web-core/skin/presets";

// Тот же приём, что у PRESETS_URL в info.ts — свой клиент, не общий синглтон: этот файл ничего
// не знает про componentInfo и наоборот, оба ходят к одной службе независимо друг от друга.
const PRESETS_URL =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

const presets = createPresetsClient({ url: PRESETS_URL });

/** Сохранённые content-записи ИМЕННО этого компонента — служба сама по component не фильтрует
 *  (`state` для неё непрозрачен), фильтр — на клиенте, тот же приём, каким это уже делает
 *  `list_content` на стороне MCP (`apps/skin/.mcp`). */
export async function listContentFor(component: string): Promise<PresetRecord<ContentState>[]> {
  const records = await presets.list(PRESET_KIND.content);
  return records.filter((record) => record.state.component === component);
}
