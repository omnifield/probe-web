import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Control as KobalteControl,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteSwitch,
  type SwitchControlProps,
  type SwitchDescriptionProps,
  type SwitchErrorMessageProps,
  type SwitchInputProps,
  type SwitchLabelProps,
  type SwitchRootProps,
  type SwitchThumbProps,
  Thumb as KobalteThumb,
} from "@kobalte/core/switch";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Семейство переключателя. Разложение то же, что у флажка, и по той же причине: настоящий
// `<input type="checkbox" role="switch">` прячут, а рисуют дорожку и бегунок.
//
// ## Чем это отличается от `Toggle`, который в зоне уже есть
//
// Разница не в виде, а в предмете, и путать их дорого:
//
//   • `Toggle` — это КНОПКА (`button[aria-pressed]`). «Применить жирный», «включить слой»:
//     действие, которое выполняется нажатием и не отправляется формой.
//   • `Switch` — это ПОЛЕ (`input[role=switch]` внутри корня). Настройка со значением, у неё
//     есть `name`, она уезжает в форму и имеет состояние ошибки.
//
// Второго компонента с тем же смыслом мы не заводим: одинаково выглядящие вещи с разной
// семантикой — это как раз то, за что расплачиваются доступностью.

/**
 * Пропсы `Switch` — корня переключателя.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SwitchProps<T extends ValidComponent = "div"> = PolymorphicProps<T, SwitchRootProps<T>>;

/**
 * Корень переключателя — ОДИН узел, по умолчанию `<div>`, плюс контекст для частей.
 *
 * Держит состояние (`checked` / `defaultChecked` / `onChange`), `disabled`, `required`,
 * `validationState`, `name` и `value` для формы. Состояние приезжает частям атрибутами
 * данных (`data-checked`, `data-disabled`) — по ним оформление и двигает бегунок.
 *
 * @example
 * ```tsx
 * <Switch checked={dark()} onChange={setDark}>
 *   <SwitchInput />
 *   <SwitchControl>
 *     <SwitchThumb />
 *   </SwitchControl>
 *   <SwitchLabel>Тёмная тема</SwitchLabel>
 * </Switch>
 * ```
 */
export function Switch<T extends ValidComponent = "div">(props: SwitchProps<T>) {
  traceLife("ui.switch");

  return <KobalteSwitch data-slot="switch" {...(props as SwitchRootProps)} />;
}

/**
 * Пропсы `SwitchInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type SwitchInputComponentProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  SwitchInputProps<T>
>;

/**
 * Настоящий ввод с `role="switch"` — ОДИН узел; он несёт фокус, форму и доступность.
 *
 * Прячут его оформлением, а не отсутствием — причина та же, что у `CheckboxInput`.
 */
export function SwitchInput<T extends ValidComponent = "input">(
  props: SwitchInputComponentProps<T>,
) {
  traceLife("ui.switch-input");

  return <KobalteInput data-slot="switch-input" {...(props as SwitchInputProps)} />;
}

/**
 * Пропсы `SwitchControl`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SwitchControlComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SwitchControlProps<T>
>;

/** Дорожка переключателя — ОДИН узел; внутри неё живёт бегунок. */
export function SwitchControl<T extends ValidComponent = "div">(
  props: SwitchControlComponentProps<T>,
) {
  traceLife("ui.switch-control");

  return <KobalteControl data-slot="switch-control" {...(props as SwitchControlProps)} />;
}

/**
 * Пропсы `SwitchThumb`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SwitchThumbComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SwitchThumbProps<T>
>;

/**
 * Бегунок — ОДИН узел, который есть ВСЕГДА, в отличие от отметки флажка.
 *
 * Так и надо: он не появляется и исчезает, а ездит, и переход между положениями пишет
 * оформление по `[data-checked]`.
 */
export function SwitchThumb<T extends ValidComponent = "div">(
  props: SwitchThumbComponentProps<T>,
) {
  traceLife("ui.switch-thumb");

  return <KobalteThumb data-slot="switch-thumb" {...(props as SwitchThumbProps)} />;
}

/**
 * Пропсы `SwitchLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type SwitchLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  SwitchLabelProps<T>
>;

/** Подпись переключателя — ОДИН узел `<label>`, связанный с вводом по контексту корня. */
export function SwitchLabel<T extends ValidComponent = "label">(
  props: SwitchLabelComponentProps<T>,
) {
  traceLife("ui.switch-label");

  return <KobalteLabel data-slot="switch-label" {...(props as SwitchLabelProps)} />;
}

/**
 * Пропсы `SwitchDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SwitchDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SwitchDescriptionProps<T>
>;

/** Пояснение к переключателю — ОДИН узел; его идентификатор уходит в `aria-describedby`. */
export function SwitchDescription<T extends ValidComponent = "div">(
  props: SwitchDescriptionComponentProps<T>,
) {
  traceLife("ui.switch-description");

  return (
    <KobalteDescription data-slot="switch-description" {...(props as SwitchDescriptionProps)} />
  );
}

/**
 * Пропсы `SwitchError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SwitchErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SwitchErrorMessageProps<T>
>;

/**
 * Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"` у корня.
 *
 * Имя слота `switch-error` — по той же причине, что и `checkbox-error`: в зоне уже есть
 * `field-error`, и одинаковая вещь называется одинаково.
 */
export function SwitchError<T extends ValidComponent = "div">(props: SwitchErrorProps<T>) {
  traceLife("ui.switch-error");

  return <KobalteErrorMessage data-slot="switch-error" {...(props as SwitchErrorMessageProps)} />;
}
