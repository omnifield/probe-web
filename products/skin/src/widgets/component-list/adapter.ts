// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/component/model/store.ts`) → форма,
// которую ждёт сборка `nested` tree-view по пути `/items/N/{id,label,children/M/{id,label}}`
// (`packages/ui/src/tree-view/playground/assemblies/nested.ts`).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ пути.
//
// ПЕРЕХОД С АККОРДЕОНА НА TREE-VIEW (`PWEB-163` продолжение, постановка user 2026-09-01): ЭТАП
// 1 — только отрисовка, сборкой `nested`, проверенной тестом
// (`packages/ui/src/tree-view/test/tree-view.test.tsx`). Клик по пункту и отметка активного
// компонента (было решено через `usePreviewComponent()`/`activeValues` у аккордеона) — отдельная
// тема, обсуждаем следующим заходом, здесь НЕ реализованы.

import type { ComponentGroup } from "../../entities/component/model/store.js";

/** Один узел дерева — форма `TreeItem` (`packages/ui/src/tree-view/entity/io.ts`): id/label/
 * необязательные дети. */
export interface TreeItemData {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

/** Раздел кита → ветка, компонент раздела → лист внутри неё. */
export function groupsToTreeItems(groups: readonly ComponentGroup[]): { readonly items: readonly TreeItemData[] } {
  return {
    items: groups.map((section) => ({
      id: section.group,
      label: section.title,
      children: section.components.map((component) => ({ id: component, label: component })),
    })),
  };
}
