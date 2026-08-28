// СПИСОК КОМПОНЕНТОВ — первый виджет (FSD), `PWEB-163`. Перечень разделов кита, каждый раздел —
// ячейка аккордеона; было плоским списком без сворачивания (`pages/showcase/ui/rail.tsx`,
// `PWEB-162` переезд из `app/rail.tsx`) — аккордеон уже есть в ките (`packages/ui/src/accordion`),
// городить своё сворачивание рядом смысла нет.
//
// НЕ СОБИРАЕТСЯ ВРУЧНУЮ (решение user 2026-08-28, отменяет предыдущую версию файла: ручной JSX
// `<Accordion><For>…</For></Accordion>` — «кастомная сборка на уровне апп», от которой ушли).
// Структуру рисует `RenderTree` по сборке аккордеона (`catalog`,
// `packages/ui/src/accordion/playground/assemblies.ts`) — тем же движком, которым рисуются
// случаи в галерее (`pages/showcase/ui/case.tsx`). Виджет передаёт только ДАННЫЕ (`data`) и
// указывает ВАРИАНТ надетого скина (`variant`) — сборку и вид несёт сборка+скин, не апп.
//
// ВИД — ИЗ НАДЕТОГО СКИНА (общий переключатель `wearing.wear()`, тот же, что решает демо-панель):
// смена скина меняет ОДНОВРЕМЕННО и показ, и саму витрину целиком, это и есть замысел, не
// побочный эффект — человек вправе одевать саму панель, не только показываемый компонент. Без
// `variant` `Accordion` рисуется дефолтной вариацией того рецепта, что сейчас надет.
//
// EXTRA `catalogItem` — КЛИКАБЕЛЬНЫЙ ПУНКТ СПИСКА (`PWEB-152`): не часть анатомии аккордеона
// (кит не обязан знать имя каталожного пункта продукта), поэтому extra, а не part — тот же приём,
// что у скрытого `<input>` чекбокса. Настоящая `Button` кита, скин её тоже одевает по своим
// правилам (`data-variant="tertiary"`, состояние `pressed`). Реестр расширяется ЛОКАЛЬНО, здесь —
// тем же приёмом, что раньше `SHELL_REGISTRY` расширял `workspace` (до `PWEB-161`, где приём был
// признан лишним ИМЕННО для композиции пяти целых экранов — здесь другой случай: это анатомия
// ОДНОГО компонента, набранная из данных, ровно то, для чего `RenderTree`/`extras` и построены).
//
// КЛИК — ЧЕРЕЗ `dispatch`, НЕ ЧЕРЕЗ ПРОП (`PWEB-157`): сборка объявляет узлу «на клике сказать
// событие "select"», `RenderTree` превращает это в настоящий `onClick`, дальше событие летит сюда
// обычным `dispatch`, а не колбэком, протащенным сквозь дерево вручную.

import { createRegistry, RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";
import { Button } from "@omnifield/probe-web-ui";
import { createMemo } from "solid-js";

import { instanceOf } from "../../entities/catalog/model/instance.js";
import { REGISTRY } from "../../entities/catalog/model/registry.js";

const ASSEMBLY_NAME = "catalog";

/** Раздел перечня: устойчивый ключ (`group`, закрытый словарь), подпись и адреса компонентов. */
export interface ComponentGroup {
  readonly group: string;
  readonly title: string;
  readonly components: readonly string[];
}

/** Кликабельный пункт списка — extra аккордеона, не часть его анатомии. */
function CatalogItem(props: { label: string; pressed?: boolean; onClick?: () => void }) {
  return (
    <Button
      data-variant="tertiary"
      data-pressed={props.pressed ? "" : undefined}
      aria-current={props.pressed ? "true" : undefined}
      onClick={props.onClick}
    >
      {props.label}
    </Button>
  );
}

export function ComponentList(props: {
  sections: readonly ComponentGroup[];
  current: string;
  onSelect: (component: string) => void;
  /** Вариация надетого скина для самого `Accordion` (например `"контурная"`, `omnifield-accordion`). */
  variant?: string;
}) {
  // Реестр витрины, расширенный ОДНИМ extra — сама витрина о каталожных пунктах не знает.
  const registry = createMemo(() => {
    const accordion = REGISTRY.components["accordion"];
    if (!accordion) throw new Error("в реестре нет «accordion» — списку компонентов нечем рисоваться");

    return createRegistry({
      components: {
        ...REGISTRY.components,
        accordion: { ...accordion, extras: { ...accordion.extras, catalogItem: CatalogItem } },
      },
      admits: (part, candidate) => REGISTRY.admits(part, candidate),
    });
  });

  // Данные под сборку `catalog` — форма, которую сборка ждёт по своим путям
  // (`/sections/N/{id,title,components/M/{id,pressed}}`).
  const data = createMemo(() => ({
    sections: props.sections.map((section) => ({
      id: section.group,
      title: section.title,
      components: section.components.map((component) => ({
        id: component,
        pressed: component === props.current,
      })),
    })),
  }));

  // Пропы, без которых кит не заработает (какие разделы раскрыты), плюс вариант скина — та же
  // точка входа, что и у случаев галереи (`entities/catalog/model/instance.ts`'s `instanceOf`).
  const tree = createMemo(() =>
    instanceOf(
      "accordion",
      {
        "data-variant": props.variant,
        multiple: true,
        defaultValue: props.sections.map((section) => section.group),
      },
      undefined,
      undefined,
      ASSEMBLY_NAME,
      data(),
    ),
  );

  const dispatch = (event: DispatchedEvent) => {
    if (event.name !== "select") return;
    const component = event.context["component"];
    if (typeof component === "string") props.onSelect(component);
  };

  return <RenderTree tree={tree()} registry={registry()} dispatch={dispatch} />;
}
