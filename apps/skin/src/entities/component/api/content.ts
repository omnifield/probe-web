import { PRESET_KIND, type ContentState, type PresetRecord } from "@web-core/skin/presets";

import { queryClient } from "#/shared/api/query-client";

import { presets } from "./client";

/** Сохранённые content-записи ИМЕННО этого компонента — служба сама по component не фильтрует
 *  (`state` для неё непрозрачен), фильтр — на клиенте, тот же приём, каким это уже делает
 *  `list_content` на стороне MCP (`apps/skin/.mcp`). Список кэширован на сессию
 *  (`staleTime: Infinity` — этот файл не Solid-компонент, поэтому кэш через императивный
 *  `queryClient.fetchQuery`, не хук `createQuery`): без явной инвалидации
 *  (`chat-did-cache-invalidation`) повторный заход на тот же/другой компонент не бьёт по сети
 *  заново. */
export async function listContentFor(component: string): Promise<PresetRecord<ContentState>[]> {
  const records = await queryClient.fetchQuery({
    queryKey: ["content", "list"],
    queryFn: () => presets.list(PRESET_KIND.content),
    staleTime: Infinity,
  });
  return records.filter((record) => record.state.component === component);
}

/** Одна content-запись по машинному имени — источник данных `/embed/...?content=<name>`, аналог
 *  MCP-инструмента `get_content`, только с фронта. Тот же кэш на сессию, что у `listContentFor`,
 *  отдельным ключом — своя запись, а не список. `null`, не `undefined`, как значение кэша:
 *  query-core запрещает queryFn возвращать `undefined` (значит «данных ещё нет», а не «записи
 *  нет»), а «имя не найдено» — законный исход (`/embed/...` без `?content=`). */
export async function getContentByName(name: string): Promise<PresetRecord<ContentState> | undefined> {
  const record = await queryClient.fetchQuery({
    queryKey: ["content", "get", name],
    queryFn: async () => (await presets.get(PRESET_KIND.content, name)) ?? null,
    staleTime: Infinity,
  });
  return record ?? undefined;
}
