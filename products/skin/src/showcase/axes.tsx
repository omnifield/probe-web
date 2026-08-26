// ОСИ — фильтр, а не раскладка.
//
// Ось в положении «все» разворачивается в поток случаев, названная — фиксируется. Так один и тот
// же показ годится компоненту любого размера: что разворачивать, решает человек.
//
// У состояния положений ТРИ: обычное · все · названное. Обычное — не «фильтр не задан», а сам
// вид компонента, когда с ним ничего не происходит; всё прочее показывает отклонения от него.
//
// ЧАСТИ ЗДЕСЬ НЕТ (решение user 2026-08-23). Смотрящий думает «наведение», а не «наведение
// корневой части»: часть — адрес внутри записи, и на витрине она была лишним выбором, который
// приходилось сделать, прежде чем добраться до нужного.
//
// Состояния собираются по ВСЕМ частям и склеиваются по имени: «раскрыт» у гармошки объявлен на
// трёх частях сразу, но для смотрящего это одно состояние компонента.

import { For } from "solid-js";

import { ANY, type Axis } from "./cases.js";
import { statesOfComponent } from "./shape.js";

/** Обычное состояние в списке выбора — ПУСТЫМ значением: именем состояния оно быть не может. */
const PLAIN = "";

export function Axes(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
}) {
  return (
    <div class="axes">
      <label class="axes__field">
        <span class="axes__label">вариация</span>
        <select
          class="axes__select"
          value={props.variant}
          disabled={props.variants.length === 0}
          onChange={(event) => props.onVariant(event.currentTarget.value)}
        >
          <option value={ANY}>все</option>
          <For each={props.variants}>{(name) => <option value={name}>{name}</option>}</For>
        </select>
      </label>

      <label class="axes__field">
        <span class="axes__label">состояние</span>
        <select
          class="axes__select"
          value={props.state ?? PLAIN}
          onChange={(event) =>
            props.onState(event.currentTarget.value === PLAIN ? null : event.currentTarget.value)
          }
        >
          {/* ОБЫЧНОЕ первым и выбранным: с него начинают смотреть, остальное — отклонения от
              него. «Все» стоит рядом и остаётся одним движением руки. */}
          <option value={PLAIN}>обычное</option>
          <option value={ANY}>все</option>
          <For each={statesOfComponent(props.component)}>
            {(state) => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </label>
    </div>
  );
}
