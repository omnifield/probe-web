// СПИСОК КОМПОНЕНТОВ ПО РАЗДЕЛАМ — СТОР (`@omnifield/probe-web-store`), а не локальная константа страницы.
//
// БЫЛ КОНСТАНТОЙ `BY_GROUP` В `pages/showcase/model/browse.ts` — переехал сюда (`entities`, не
// `pages`): перечень разделов/компонентов нужен не только витрине, виджет пульта (`widgets/
// component-list`) его тоже читает, и второй копии того же вычисления рядом заводить нельзя —
// разойдётся с первой на первой же правке одной из них (постановка user, 2026-08-28).
//
// СТОР, А НЕ ПРОСТО ЭКСПОРТИРОВАННАЯ КОНСТАНТА — по прямой постановке user: список живёт в
// `@omnifield/probe-web-store` (`createStore`), читается `useSelector`-аксессором. Контекст пока
// не меняется никакими событиями (`on: {}`) — перечень вычисляется один раз из реестра при
// загрузке модуля; события появятся, если/когда реестр станет живым (горячая замена, второй
// поставщик компонентов на лету).

import { createStore, useSelector } from "@omnifield/probe-web-store";
import { knownComponents } from "@omnifield/probe-web-assembly";
import { GROUPS, groupOf } from "@omnifield/probe-web-ui/passport";

import { editorInfoOf } from "./providers.js";
import { REGISTRY } from "./registry.js";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
export const COMPONENTS = knownComponents(REGISTRY);

/** Раздел каталога: устойчивый ключ (`group`, закрытый словарь), подпись и адреса компонентов. */
export interface ComponentGroup {
  readonly group: string;
  readonly title: string;
  readonly components: readonly string[];
}

/**
 * Компоненты по разделам.
 *
 * Раздел объявляет САМ компонент (`group` в срезе редактора — `PWEB-115`/`PWEB-118`, паспорт
 * рантайма его не несёт), а перечень разделов и их подписи живут у формы паспорта. Своего перечня
 * не заводим: назови мы разделы сами — их стало бы два, и у следующего потребителя третий.
 * Порядок разделов — порядок объявления в перечне, а не наш.
 *
 * Пустые разделы не показываются: раздел без компонентов это обещание, которого никто не давал.
 */
function groupsOf(): readonly ComponentGroup[] {
  return Object.entries(GROUPS)
    .map(([group, title]) => ({
      group,
      title,
      components: COMPONENTS.filter((component) => {
        const editorInfo = editorInfoOf(component);
        return editorInfo !== undefined && groupOf(editorInfo) === group;
      }),
    }))
    .filter((section) => section.components.length > 0);
}

/** Стор списка: разделы кита по группам. */
export const componentGroupsStore = createStore({
  context: { groups: groupsOf() },
  on: {},
});

/** Разделы кита — реактивный аксессор (`groups()`, не `groups`). */
export function useComponentGroups() {
  return useSelector(componentGroupsStore, (state) => state.context.groups);
}
