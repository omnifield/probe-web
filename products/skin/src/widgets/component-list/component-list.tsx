// СПИСОК КОМПОНЕНТОВ — первый виджет (FSD), `PWEB-163`. Аккордеон подключён РОВНО ТЕМ ЖЕ ПУТЁМ,
// каким его рисует витрина (`pages/showcase/ui/component-page.tsx` → `Case` → `RenderTree`):
// `instanceOf("accordion", …, "action-list", data)` — сборка уже есть в ките
// (`packages/ui/src/accordion/playground/assemblies.ts`), своей сборки (ни схемой, ни ручным JSX)
// здесь нет и не заводится. `REGISTRY` — тот же самый, нетронутый, никакого локального
// расширения (решение user 2026-08-28: предыдущие заходы городили то свою сборку `catalog` в
// ките, то `extras`/локальный реестр в продукте — оба раза лишнее, раз универсальный путь витрины
// уже решает ровно эту задачу).
//
// ДАННЫЕ — ИЗ СТОРА, НЕ МОКИ (постановка user, 2026-08-28: «фреймворк добавили стор... список
// хранится в сторе... виджет берёт список из стора и рисует в аккордеоне через адаптер»).
// `useComponentGroups()` — реактивный аксессор стора (`entities/component/model/store.ts`,
// `@omnifield/probe-web-store`), `groupsToSectionsData` — АДАПТЕР (`./adapter.ts`): каталожная
// форма → форма, которую ждут пути сборки (`/sections`). Адаптер ВРЕМЕННО продуктовый —
// универсальный механизм переедет из фреймворка позже, здесь только конкретная форма под эти пути.
//
// ВИД — ИЗ НАДЕТОГО СКИНА, `variant` только называет, каким вариантом одеть корень (`data-variant`
// аккордеона, например `"контурная"`, `omnifield-accordion`) — тем же приёмом, что и любой другой
// показанный на витрине компонент.
//
// СБОРКА `action-list` (`PWEB-166`, лист вместо кнопки — 2026-08-30): контент раздела — настоящий
// Listbox из общего реестра, по пункту на каждый компонент раздела.
//
// КЛИК ПЕРЕКЛЮЧАЕТ МАРШРУТ (`PWEB-173`). У пункта листбокса нет своего `selfAssembly` — сборка
// сама вешает `on.click` → `{name:"select", context:{payload}}` на `listbox.item`
// (`accordion/playground/assemblies/action-list.ts`), тем же приёмом, что и `itemTrigger`'s
// `triggerClick` рядом: родной клик Ark (выбор пункта) и наш `on` не конфликтуют, оба срабатывают.
// `ComponentList` это событие не изобретает, а просто СЛУШАЕТ через `dispatch`. `payload` — весь
// пункт раздела (`AccordionItemData`, `./adapter.ts`), `payload.value` — имя компонента, оно же
// адрес показа (`/showcase/<имя>`).

import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";
import { useNavigate } from "@omnifield/probe-web-router";
import { createMemo } from "solid-js";

import { useComponentGroups } from "../../entities/component/model/store.js";
import { instanceOf } from "../../entities/component/model/instance.js";
import { REGISTRY } from "../../entities/component/model/registry.js";
import { groupsToSectionsData, type AccordionItemData } from "./adapter.js";

const ASSEMBLY_NAME = "action-list";

export function ComponentList(props: {
  /** Вариация надетого скина для `Accordion` (например `"контурная"`, `omnifield-accordion`). */
  variant?: string;
}) {
  const navigate = useNavigate();
  const groups = useComponentGroups();
  const data = createMemo(() => groupsToSectionsData(groups()));

  const tree = createMemo(() =>
    instanceOf(
      "accordion",
      // Все разделы открыты на старте, и каждый переключается независимо (постановка user,
      // 2026-08-29): `multiple` — несколько сразу, `collapsible` — можно закрыть открытый,
      // `defaultValue` — НАЧАЛЬНЫЙ (неконтролируемый) список открытых, весь перечень разделов.
      {
        "data-variant": props.variant,
        multiple: true,
        collapsible: true,
        defaultValue: data().sections.map((section) => section.id),
      },
      ASSEMBLY_NAME,
      data(),
    ),
  );

  /**
   * `triggerClick` (раскрытие раздела) сюда тоже долетает — фильтруем по имени: слушаем ровно то
   * событие, которое шлёт КНОПКА компонента, не раздел, который её держит.
   */
  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "select") return;

    const payload = event.context["payload"] as AccordionItemData | undefined;
    if (payload === undefined) return;

    void navigate({ to: "/showcase/$component", params: { component: payload.value } });
  };

  return <RenderTree tree={tree()} registry={REGISTRY} data={data()} dispatch={onDispatch} />;
}
