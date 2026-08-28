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
//
// ПИКЕРЫ — НАСТОЯЩИЙ `field` кита (`PWEB-161`, `kit-bridge.ts`), не голый `<select>`: пульт
// одевается тем же нарядом, что и показанные продукты (постановка user, «скин пульта такой же,
// как у продуктов»). `Field`/`FieldSelect` через `partOf` — компонент ещё не доехал до
// именованного экспорта корня, но паспорт и наряд у него уже настоящие (`kit-bridge.ts`
// объясняет почему это не обход, а тот же путь, которым читает кит сама витрина).

import { For, Show, type JSX } from "solid-js";

import { Flow } from "@omnifield/probe-web-ui";
import type { PassportAssembly } from "@omnifield/probe-web-ui/passport";

import { ANY, type Axis } from "../../../entities/catalog/model/cases.js";
import { statesOfComponent } from "../../../entities/catalog/model/shape.js";
import { partOf } from "./kit-bridge.js";

const Field = partOf<{ children?: JSX.Element }>("field", "root");
const FieldLabel = partOf<{ children?: JSX.Element }>("field", "label");
const FieldSelect = partOf<JSX.SelectHTMLAttributes<HTMLSelectElement>>("field", "select");

/** Одна ось: подпись плюс `<select>`, оба через настоящий `field`. */
function Picker(props: { label: string; children: JSX.Element } & JSX.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field>
      <FieldLabel>{props.label}</FieldLabel>
      <FieldSelect value={props.value} disabled={props.disabled} onChange={props.onChange}>
        {props.children}
      </FieldSelect>
    </Field>
  );
}

/** Пустая строка — «не выбирали»: тем же приёмом, что у обычного состояния. */
const PLAIN = "";

export function Axes(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  /**
   * СБОРКИ — не ось (`instance.ts`): не «вид меняется», а «показан другой рабочий экземпляр».
   * У подавляющего большинства компонентов сборка одна, и тогда выбора нет вовсе — ручка, у
   * которой один пункт, не ручка, а обещание выбора, которого нет.
   */
  assemblies: readonly PassportAssembly[];
  assembly: string;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
  onAssembly: (assembly: string) => void;
}) {
  return (
    <Flow>
      <Show when={props.assemblies.length > 1}>
        <Picker
          label="сборка"
          value={props.assembly === "" ? (props.assemblies[0]?.name ?? "") : props.assembly}
          onChange={(event) => props.onAssembly(event.currentTarget.value)}
        >
          <For each={props.assemblies}>{(item) => <option value={item.name}>{item.means}</option>}</For>
        </Picker>
      </Show>

      <Picker
        label="вариация"
        value={props.variant}
        disabled={props.variants.length === 0}
        onChange={(event) => props.onVariant(event.currentTarget.value)}
      >
        <option value={ANY}>все</option>
        <For each={props.variants}>{(name) => <option value={name}>{name}</option>}</For>
      </Picker>

      <Picker
        label="состояние"
        value={props.state ?? PLAIN}
        onChange={(event) => props.onState(event.currentTarget.value === PLAIN ? null : event.currentTarget.value)}
      >
        {/* ОБЫЧНОЕ первым и выбранным: с него начинают смотреть, остальное — отклонения от
            него. «Все» стоит рядом и остаётся одним движением руки. */}
        <option value={PLAIN}>обычное</option>
        <option value={ANY}>все</option>
        <For each={statesOfComponent(props.component)}>{(state) => <option value={state.name}>{state.name}</option>}</For>
      </Picker>
    </Flow>
  );
}
