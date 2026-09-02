// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/component/model/store.ts`) → форма,
// которую ждёт БАЗОВАЯ сборка tree-view (`packages/ui/src/tree-view/playground/assemblies/base.ts`,
// рекурсивная — один и тот же узел `{id,label,children}` на любом уровне).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ данные.
//
// ТРИ УРОВНЯ (постановка user, 2026-09-02): раздел кита → ветка; компонент раздела → тоже ветка
// (раскрывашка), а не лист; сборки компонента → листья внутри него. Клик по ветке — раскрытие/
// закрытие, движок дерева умеет сам, дальше это не касается. Клик по листу — отдельная тема
// (`component-list.tsx`).
//
// ID ЛИСТА СОСТАВНОЙ (`компонент/сборка`) — имя сборки само по себе не уникально (`base` есть
// почти у каждого компонента), а Ark строит дерево по `id`: одинаковые id на разных компонентах
// схлопнулись бы в один узел.

import type { ComponentGroup } from "../../entities/component/model/store.js";
import { editorInfoOf } from "../../entities/component/model/providers.js";

/** Один узел дерева — форма `TreeItem` (`packages/ui/src/tree-view/entity/io.ts`): id/label/
 * необязательные дети. */
export interface TreeItemData {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

/** Сборки компонента → листья. Компонент без единой объявленной сборки — пустой список, не сбой. */
function assembliesToTreeItems(component: string): readonly TreeItemData[] {
  const assemblies = editorInfoOf(component)?.assemblies ?? [];
  return assemblies.map((assembly) => ({
    id: `${component}/${assembly.name}`,
    label: assembly.name,
  }));
}

/** Раздел кита → ветка, компонент раздела → ветка, сборка компонента → лист внутри неё. */
export function groupsToTreeItems(groups: readonly ComponentGroup[]): { readonly items: readonly TreeItemData[] } {
  return {
    items: groups.map((section) => ({
      id: section.group,
      label: section.title,
      children: section.components.map((component) => ({
        id: component,
        label: component,
        children: assembliesToTreeItems(component),
      })),
    })),
  };
}
