// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/component/model/store.ts`) → форма,
// которую ждёт БАЗОВАЯ сборка tree-view (`packages/ui/src/tree-view/playground/assemblies/base.ts`,
// рекурсивная — один и тот же узел `{id,label,children}` на любом уровне).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ данные.
//
// УРОВНИ (постановка user, 2026-09-02, сборки уточнены 2026-09-03): раздел кита → ветка всегда.
// Компонент раздела — ветвится по числу его сборок: БОЛЬШЕ ОДНОЙ — сам ветка (раскрывашка),
// сборки — листья внутри; РОВНО ОДНА (обычно `base`, других у компонента и нет) — сборку
// показывать отдельным уровнем незачем, компонент сам и есть лист. Клик по ветке — раскрытие/
// закрытие, движок дерева умеет сам, дальше это не касается. Клик по листу — отдельная тема
// (`component-list.tsx`).
//
// ID ЛИСТА СОСТАВНОЙ (`компонент/сборка`) ВСЕГДА, даже когда сборка одна и в дереве отдельным
// узлом не видна: `component-list.tsx` разбирает id листа по `/`, чтобы узнать, какую сборку
// открывать, — вторая форма id для «свёрнутого» случая завела бы вторую ветку разбора там.

import type { ComponentGroup } from "../../entities/component/model/store.js";
import { editorInfoOf } from "../../entities/component/model/providers.js";

/** Один узел дерева — форма `TreeItem` (`packages/ui/src/tree-view/entity/io.ts`): id/label/
 * необязательные дети. */
export interface TreeItemData {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

/**
 * Компонент раздела → узел дерева. Больше одной сборки — ветка, сборки под ней — листья. Не
 * больше одной (одна объявленная, либо ни одной — `instanceOf` в этом случае сам берёт образец
 * из анатомии, `entities/component/model/instance.ts`) — сборку отдельным уровнем не показываем,
 * лист — сам компонент.
 */
function componentToTreeItem(component: string): TreeItemData {
  const assemblies = editorInfoOf(component)?.assemblies ?? [];

  if (assemblies.length > 1) {
    return {
      id: component,
      label: component,
      children: assemblies.map((assembly) => ({
        id: `${component}/${assembly.name}`,
        label: assembly.name,
      })),
    };
  }

  return { id: `${component}/${assemblies[0]?.name ?? "base"}`, label: component };
}

/** Раздел кита → ветка, компонент раздела → узел по числу его сборок (`componentToTreeItem`). */
export function groupsToTreeItems(groups: readonly ComponentGroup[]): { readonly items: readonly TreeItemData[] } {
  return {
    items: groups.map((section) => ({
      id: section.group,
      label: section.title,
      children: section.components.map(componentToTreeItem),
    })),
  };
}
