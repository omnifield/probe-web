// СПИСОК КОМПОНЕНТОВ — виджет (FSD), `PWEB-163`.
//
// ПЕРЕХОД С АККОРДЕОНА НА TREE-VIEW, ЭТАП 1 — ТОЛЬКО ОТРИСОВКА (постановка user, 2026-09-01):
// «выглядит как надо! го подключать» — после того, как в чате был показан и одобрен ровно этот
// код. Собран тем же путём, каким аккордеон рисовала витрина (`instanceOf` + `RenderTree`) —
// сборка `nested` уже есть в ките (`packages/ui/src/tree-view/playground/assemblies/nested.ts`)
// и проверена тестом, своей сборки здесь не заводится.
//
// КЛИК ПО ПУНКТУ (переключение маршрута) И ОТМЕТКА АКТИВНОГО КОМПОНЕНТА — у аккордеона это было
// (`on.click` → `"select"`, `usePreviewComponent()` → `activeValues`) — ЗДЕСЬ ПОКА НЕТ. Это
// отдельная тема, обсуждаем следующим заходом, до тех пор список кликабелен не более, чем
// показывает раскрытие/схлопывание веток.
//
// ДАННЫЕ — ИЗ СТОРА, НЕ МОКИ (постановка user, 2026-08-28, не изменилась переходом на tree-view):
// `useComponentGroups()` — реактивный аксессор стора, `groupsToTreeItems` — АДАПТЕР
// (`./adapter.ts`): каталожная форма → форма, которую ждёт сборка `nested`.
//
// `collection` — НЕ JSON: `TreeView`'s собственный `collection` не строится сборкой
// (`packages/ui/src/tree-view/components/kit.tsx`'s комментарий), поэтому собирается здесь и
// кладётся поверх сборки литеральным пропом — тем же приёмом `instanceOf` сливает `rootProps`,
// каким аккордеон получал `multiple`/`collapsible`/`defaultValue`
// (`products/skin/src/entities/component/model/instance.ts`).
//
// `defaultExpandedValue` — все разделы раскрыты сразу, тот же эффект, что `defaultValue`
// аккордеона давал через `multiple`+`collapsible`.

import { createTreeCollection, type TreeCollection } from "@omnifield/probe-web-ui";
import { RenderTree } from "@omnifield/probe-web-assembly";
import { createMemo } from "solid-js";

import { useComponentGroups } from "../../entities/component/model/store.js";
import { instanceOf } from "../../entities/component/model/instance.js";
import { REGISTRY } from "../../entities/component/model/registry.js";
import { groupsToTreeItems, type TreeItemData } from "./adapter.js";

const ASSEMBLY_NAME = "nested";

export function ComponentList(props: {
  /** Вариация надетого скина для `TreeView` (например `"outline"`, `omnifield-tree-view`). */
  variant?: string;
}) {
  const groups = useComponentGroups();
  const data = createMemo(() => groupsToTreeItems(groups()));

  const collection = createMemo((): TreeCollection<TreeItemData> =>
    createTreeCollection<TreeItemData>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.label,
      rootNode: { id: "ROOT", label: "", children: data().items },
    }),
  );

  const tree = createMemo(() =>
    instanceOf(
      "tree-view",
      {
        "data-variant": props.variant,
        collection: collection(),
        defaultExpandedValue: data().items.map((item) => item.id),
      },
      ASSEMBLY_NAME,
      data(),
    ),
  );

  return <RenderTree tree={tree()} registry={REGISTRY} data={data()} />;
}
