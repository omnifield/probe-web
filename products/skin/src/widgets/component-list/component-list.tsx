// СПИСОК КОМПОНЕНТОВ — первый виджет (FSD), `PWEB-163`. Аккордеон подключён РОВНО ТЕМ ЖЕ ПУТЁМ,
// каким его рисует витрина (`pages/showcase/ui/component-page.tsx` → `Case` → `RenderTree`):
// `instanceOf("accordion", …, "с-кнопками", data)` — сборка уже есть в ките
// (`packages/ui/src/accordion/playground/assemblies.ts`), своей сборки (ни схемой, ни ручным JSX)
// здесь нет и не заводится. `REGISTRY` — тот же самый, нетронутый, никакого локального
// расширения (решение user 2026-08-28: предыдущие заходы городили то свою сборку `catalog` в
// ките, то `extras`/локальный реестр в продукте — оба раза лишнее, раз универсальный путь витрины
// уже решает ровно эту задачу).
//
// ДАННЫЕ — ИЗ СТОРА, НЕ МОКИ (постановка user, 2026-08-28: «фреймворк добавили стор... список
// хранится в сторе... виджет берёт список из стора и рисует в аккордеоне через адаптер»).
// `useCatalogGroups()` — реактивный аксессор стора (`entities/catalog/model/store.ts`,
// `@omnifield/probe-web-store`), `groupsToSectionsData` — АДАПТЕР (`./adapter.ts`): каталожная
// форма → форма, которую ждут пути сборки (`/sections`). Адаптер ВРЕМЕННО продуктовый —
// универсальный механизм переедет из фреймворка позже, здесь только конкретная форма под эти пути.
//
// ВИД — ИЗ НАДЕТОГО СКИНА, `variant` только называет, каким вариантом одеть корень (`data-variant`
// аккордеона, например `"контурная"`, `omnifield-accordion`) — тем же приёмом, что и любой другой
// показанный на витрине компонент.
//
// СБОРКА `с-кнопками` (`PWEB-166`): контент раздела — настоящая Button из общего реестра, а не
// схлопнутый текст. КЛИК-НАВИГАЦИЯ ПОКА НЕ ПОДКЛЮЧЕНА: кнопка одна на раздел (список компонентов
// раздела схлопнут в её подпись через запятую), не по кнопке на каждый компонент — список
// кликабельных ПУНКТОВ внутри раздела остаётся следующим шагом.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { createMemo } from "solid-js";

import { useCatalogGroups } from "../../entities/catalog/model/store.js";
import { instanceOf } from "../../entities/catalog/model/instance.js";
import { REGISTRY } from "../../entities/catalog/model/registry.js";
import { groupsToSectionsData } from "./adapter.js";

const ASSEMBLY_NAME = "с-кнопками";

export function ComponentList(props: {
  /** Вариация надетого скина для `Accordion` (например `"контурная"`, `omnifield-accordion`). */
  variant?: string;
}) {
  const groups = useCatalogGroups();
  const data = createMemo(() => groupsToSectionsData(groups()));

  const tree = createMemo(() =>
    instanceOf(
      "accordion",
      { "data-variant": props.variant },
      undefined,
      undefined,
      ASSEMBLY_NAME,
      data(),
    ),
  );

  return <RenderTree tree={tree()} registry={REGISTRY} data={data()} />;
}
