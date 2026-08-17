import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { Root as KobalteToggleButton, type ToggleButtonRootProps } from "@kobalte/core/toggle-button";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

/**
 * Пропсы `Toggle`: всё, что принимает целевой элемент, плюс `pressed` / `defaultPressed` /
 * `onChange`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type ToggleProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ToggleButtonRootProps<T>
>;

/**
 * Двухпозиционная кнопка — ОДИН узел `<button aria-pressed>`.
 *
 * Работает в обоих режимах, и это механика kobalte, а не наша: `pressed` — управляемый,
 * `defaultPressed` — неуправляемый, `onChange` зовётся в обоих. Состояние наружу отдаётся
 * атрибутом `data-pressed`, по нему потребитель и стилизует.
 *
 * **Почему `ToggleButton`, а не `Switch`.** В оракуле `Toggle` был переключателем-тумблером и
 * рендерил ТРИ узла: `<div>` с `<button>` и `<label>` внутри. Это прямое нарушение 1-to-1, и
 * оно же делало примитив нестилизуемым снаружи — разметку задавал он, а не потребитель.
 * Нужен именно тумблер с бегунком — это `Switch` из kobalte, отдельный компонент с
 * собственной композицией частей; в первую волну он не входит (нет потребителя).
 *
 * Подпись рядом с кнопкой — тоже композиция потребителя: `<Label for>` + `<Toggle id>`.
 *
 * @example
 * ```tsx
 * <Toggle defaultPressed onChange={setBold}>Ж</Toggle>
 * <Toggle pressed={bold()} onChange={setBold} aria-label="Полужирный" />
 * ```
 */
export const Toggle = slotAware(function Toggle<T extends ValidComponent = "button">(props: ToggleProps<T>) {
  traceLife("ui.toggle");

  const [slot, rest] = useSlot(props, "toggle");

  return <KobalteToggleButton {...slot} {...(rest as ToggleButtonRootProps)} />;
});
