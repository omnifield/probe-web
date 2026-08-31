// ВХОД — виджет (FSD, был `widgets/data-panel`, разведён на вход/выход постановкой user,
// 2026-08-30). Место в `WorkspaceRightbar`, где человек наполняет показанный на витрине
// компонент данными (PWEB-187, этап 1 из 3: встроенные заготовки; этап 2 — свои данные +
// адаптер; этап 3 — API + адаптер, оба ещё не начаты).
//
// Запись — из ЛЮБОЙ темы разом, без промежуточного выбора темы (постановка user, 2026-08-30:
// «объедени оба селекта в один, без выбора темы, просто все пачкой») — только СОВМЕСТИМЫЕ с
// паспортом формы текущего компонента (`compatibleItems`, PWEB-189), без адаптера: запись либо
// проходит форму как есть, либо не показывается в списке вовсе. Выбор пишется в общий стор
// (`entities/preview`), откуда его читает `ComponentPreview` — эта панель понятия не имеет, ЧТО
// рисуется, только чем это наполнить.
//
// РИСУЕТСЯ НАСТОЯЩИМ `select` КИТА, ТЕМ ЖЕ ФЛОУ, ЧТО И ВИТРИНА (`instanceOf` + `RenderTree` +
// общий `REGISTRY`, `pages/_workspace/showcase/index.tsx`) — не нативным `<select>`: панель
// одевается настоящим скином (`omnifield-select`), а не голым HTML.
//
// ВЫБОР ЛОВИТСЯ ЧЕРЕЗ `on`/`dispatch`, ТЕМ ЖЕ ПУТЁМ, ЧТО И `widgets/component-list/
// component-list.tsx` — не пропом `onValueChange` на корне (это НЕ доезжает никуда, что и
// потребовало разбора живьём, 2026-08-30). У `select`'s "basic" сборки (`packages/ui/src/select/
// playground/assemblies.ts`) `item` сам вешает `on.click` → `{name:"select", context:{payload}}`
// — родной клик Ark (выбор пункта) и наш `on` не конфликтуют, оба срабатывают, тем же приёмом,
// что и `listbox.item` в `accordion`'s `action-list`. `DataInput` это событие не изобретает, а
// просто слушает через `dispatch`.

import { compatibleItems } from "@omnifield/probe-web-io";
import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";
import { createEffect, createMemo, Show } from "solid-js";

import { instanceOf } from "#/entities/component/model/instance.js";
import { IO } from "#/entities/component/model/io.js";
import { REGISTRY } from "#/entities/component/model/registry.js";
import { PACKS } from "#/entities/packs/model/registry.js";
import { previewStore, usePreviewComponent } from "#/entities/preview/model/store.js";

/** Подпись для пункта списка — `label`, если он есть строкой, иначе запись целиком. */
function captionOf(item: Record<string, unknown>): string {
  const label = item["label"];
  return typeof label === "string" ? label : JSON.stringify(item);
}

export function DataInput() {
  const component = usePreviewComponent();
  const io = createMemo(() => {
    const name = component();
    return name === undefined ? undefined : IO.get(name);
  });

  /** Все совместимые записи КАЖДОЙ темы разом, одним плоским перечнем. */
  const items = createMemo((): Record<string, unknown>[] => {
    const entry = io();
    if (!entry) return [];
    // Каст на границе: `IoEntry.schema` типизирован обобщённо (`z.ZodType`, PWEB-181) — реестр
    // сознательно не несёт конкретный тип каждой записи, паспорта формы разные у разных
    // компонентов. Рантайм гарантирует объект — все паспорта формы сегодня объектные схемы.
    return PACKS.themes().flatMap(
      (theme) =>
        compatibleItems(entry.schema, PACKS.require(theme)) as Record<
          string,
          unknown
        >[],
    );
  });

  /** Данные под путь `select`'s "basic" сборки (`../../../../../packages/ui/src/select/playground/assemblies.ts`). */
  const data = createMemo(() => ({
    label: "Запись",
    placeholder: "— выбрать —",
    items: items().map((item, index) => ({
      value: String(index),
      label: captionOf(item),
    })),
  }));

  // Первая запись — активна по умолчанию (постановка user, 2026-08-30), не только визуально
  // (`defaultValue` ниже), но и по факту: превью обязано показывать хоть что-то, не ждать
  // ручного клика. Перезаписывается заново при смене показанного компонента — `items()` меняется
  // ровно тогда же, `filled` едет вместе с ней.
  createEffect(() => {
    previewStore.trigger.filled({ fill: items()[0] });
  });

  const tree = createMemo(() =>
    instanceOf("select", { defaultValue: items().length > 0 ? ["0"] : undefined }, "basic", data()),
  );

  // `payload` — the select's OWN item shell (`{value, label}`, `data()`'s `items` mapping below),
  // not the real record: `value` is the flattened array INDEX as a string, the same trick the
  // trigger's own `defaultValue`/`onValueChange` used before this rewrite. Look the real record
  // up by it — `event.context.payload` was never the compatible record itself.
  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "select") return;

    const payload = event.context["payload"] as { value: string } | undefined;
    if (payload === undefined) return;

    previewStore.trigger.filled({ fill: items()[Number(payload.value)] });
  };

  return (
    // `width: 100%` + `min-width: 0` — эта панель сама сидит в чужом флекс-столбце
    // (`WorkspaceRightbar`), и без явной ширины/минимума блок растёт под длинную неразрывную
    // подпись (`captionOf`'s `JSON.stringify` — запасной путь без поля `label`, длина которого не
    // предсказать) вместо того, чтобы подпись обрезалась по границе колонки (`--select`'s own
    // `control`/`trigger`/`valueText`, `packages/ui/src/select/playground/recipe.ts`).
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "var(--space-4)",
        width: "100%",
        "min-width": "0",
        "box-sizing": "border-box",
      }}
    >
      <h2>Вход</h2>

      <Show
        when={io()}
        fallback={
          <p>
            У «{component() ?? "—"}» ещё нет паспорта формы — заготовками
            наполнить нечем.
          </p>
        }
      >
        <RenderTree tree={tree()} registry={REGISTRY} data={data()} dispatch={onDispatch} />
        <p>
          {items().length} совместимых записей из {PACKS.themes().length} тем
        </p>
      </Show>
    </div>
  );
}
