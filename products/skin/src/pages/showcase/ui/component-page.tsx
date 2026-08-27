// СТРАНИЦА КОМПОНЕНТА — показ, и только он.
//
// Витрина существует, чтобы СМОТРЕТЬ: полистать компоненты, переключить скин, показать человеку,
// который оценивает вид, а не устройство. Поэтому здесь нет ни долга одевания, ни перечня частей
// с состояниями, ни паспортных фактов — всё это техничка, и живёт она отдельно (решение user
// 2026-08-21).
//
// Убрано не «потому что мешает», а потому что смешение двух предметов портит оба: заказчик,
// которому показывают вид, спотыкается о долг и род компонента, а одевающий ищет техничку среди
// картинок.
//
// Выбор ВИДА — витрина или форма — стоит в хедере, а не здесь: страница показывает то, что ей
// велели, и не решает, показывать ли себя.

import type { DispatchedEvent } from "@omnifield/probe-web-assembly";
import { Flow } from "@omnifield/probe-web-ui";
import type { DataPreset } from "@omnifield/probe-web-ui/passport";
import { For, Show } from "solid-js";

import { casesOf, type Axis } from "../../../entities/catalog/model/cases.js";
import { Case } from "./case.jsx";

export function ComponentPage(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  settings: Readonly<Record<string, unknown>>;
  assembly: string;
  /**
   * Выбранное заполнение (`PWEB-156`) — `null`, пока человек не выбрал ни одного. НЕ отдельная,
   * вынесенная в сторону карточка: данные — ось всей галереи, действует на КАЖДЫЙ случай сразу
   * (`casesOf`'s `Slice.data`) — вариацию, состояние, что угодно ещё показывает сборка
   * (постановка user, 2026-08-27 — «должно идти на все вариации, а не маленько тут маленько
   * тут»). Какую сборку показывать (`basic`/`filled`) решает ось «сборка» в шапке (`Head`/
   * `Axes`) — `browse.ts` переключает её на `filled` сама, когда выбрано заполнение.
   */
  dataPreset: DataPreset | null;
  /** Одна точка входа для событий узла (`PWEB-157`) — прокинута каждому показанному дереву. */
  dispatch?: (event: DispatchedEvent) => void;
}) {
  // Часть не называется: на витрине её нет, и состояние ставится на ту часть, которая его
  // объявила, — это знает сборка случая, а не показ.
  const cases = () =>
    casesOf(props.component, {
      variant: props.variant,
      state: props.state,
      variants: props.variants,
      settings: props.settings,
      // Пустая строка — «не выбирали», а не имя сборки: тем же приёмом, что и у обычного
      // состояния в `Axes` (`PLAIN`). Пустого имени сборки не бывает.
      assembly: props.assembly === "" ? undefined : props.assembly,
      data: props.dataPreset?.data,
    });

  return (
    <article class="page">
      <Show when={props.variants.length === 0}>
        <p class="page__empty">
          Скин не надет — показан голый кит. Это рабочее состояние продукта, а не поломка витрины:
          наденьте скин справа вверху.
        </p>
      </Show>

      <Flow class="cases">
        <For each={cases()}>
          {(item) => <Case component={props.component} item={item} data={props.dataPreset?.data} dispatch={props.dispatch} />}
        </For>
      </Flow>
    </article>
  );
}
