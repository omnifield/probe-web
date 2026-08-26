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

import { For, Show } from "solid-js";

import { Case } from "./case.jsx";
import { casesOf, type Axis } from "./cases.js";

export function ComponentPage(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  settings: Readonly<Record<string, unknown>>;
}) {
  // Часть не называется: на витрине её нет, и состояние ставится на ту часть, которая его
  // объявила, — это знает сборка случая, а не показ.
  const cases = () =>
    casesOf(props.component, {
      variant: props.variant,
      state: props.state,
      variants: props.variants,
      settings: props.settings,
    });

  return (
    <article class="page">
      <Show when={props.variants.length === 0}>
        <p class="page__empty">
          Скин не надет — показан голый кит. Это рабочее состояние продукта, а не поломка витрины:
          наденьте скин справа вверху.
        </p>
      </Show>

      <div class="cases">
        <For each={cases()}>{(item) => <Case item={item} />}</For>
      </div>
    </article>
  );
}
