import {
  DecrementTrigger as KobalteDecrement,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  HiddenInput as KobalteHiddenInput,
  IncrementTrigger as KobalteIncrement,
  Input as KobalteInput,
  Label as KobalteLabel,
  type NumberFieldDecrementTriggerProps,
  type NumberFieldDescriptionProps,
  type NumberFieldErrorMessageProps,
  type NumberFieldHiddenInputProps,
  type NumberFieldIncrementTriggerProps,
  type NumberFieldInputProps,
  type NumberFieldLabelProps,
  type NumberFieldRootProps,
  Root as KobalteNumberField,
} from "@kobalte/core/number-field";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Числовое поле: количество, диапазон фильтра, масштаб карты.
//
// ## Почему это не `<Input type="number">`
//
// Нативное числовое поле ведёт себя по-разному в каждом браузере: колёсико мыши меняет
// значение случайным касанием, стрелки не стилизуются, а разделитель дробной части зависит от
// локали ввода, а не документа. Здесь всё это разложено на части: значение считает kobalte,
// формат разбирает `Intl.NumberFormat` (проп `formatOptions`), а кнопки — обычные `<button>`,
// которые оформляются как угодно.
//
// ## Два ввода, и оба настоящие
//
// `number-field-input` — то, что видно и во что печатают (`inputmode`, разбор формата).
// `number-field-hidden-input` — то, что уезжает в форму СЫРЫМ числом: «1 234,50» отправить
// нельзя, форма ждёт `1234.5`.

/**
 * Пропсы `NumberField` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NumberFieldProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  NumberFieldRootProps<T>
>;

/**
 * Корень числового поля — ОДИН узел плюс контекст для частей.
 *
 * Держит значение (`value` / `defaultValue` / `onChange` / `onRawValueChange`), границы
 * (`minValue`, `maxValue`, `step`, `largeStep`), формат (`formatOptions`) и состояние поля.
 *
 * @example
 * ```tsx
 * <NumberField value={count()} onRawValueChange={setCount} minValue={0} step={1}>
 *   <NumberFieldLabel>Количество</NumberFieldLabel>
 *   <NumberFieldDecrement>−</NumberFieldDecrement>
 *   <NumberFieldInput />
 *   <NumberFieldIncrement>+</NumberFieldIncrement>
 * </NumberField>
 * ```
 */
export function NumberField<T extends ValidComponent = "div">(props: NumberFieldProps<T>) {
  traceLife("ui.number-field");

  return <KobalteNumberField data-slot="number-field" {...(props as NumberFieldRootProps)} />;
}

/**
 * Пропсы `NumberFieldLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type NumberFieldLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  NumberFieldLabelProps<T>
>;

/** Подпись поля — ОДИН узел `<label>`, связанный с вводом по контексту корня. */
export function NumberFieldLabel<T extends ValidComponent = "label">(
  props: NumberFieldLabelComponentProps<T>,
) {
  traceLife("ui.number-field-label");

  return <KobalteLabel data-slot="number-field-label" {...(props as NumberFieldLabelProps)} />;
}

/**
 * Пропсы `NumberFieldInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type NumberFieldInputComponentProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  NumberFieldInputProps<T>
>;

/** Видимый ввод — ОДИН узел `<input>`; в нём значение показано в выбранном формате. */
export function NumberFieldInput<T extends ValidComponent = "input">(
  props: NumberFieldInputComponentProps<T>,
) {
  traceLife("ui.number-field-input");

  return <KobalteInput data-slot="number-field-input" {...(props as NumberFieldInputProps)} />;
}

/**
 * Скрытый ввод для формы — ОДИН узел с СЫРЫМ числом.
 *
 * Нужен, когда поле уезжает обычной отправкой формы: отформатированную строку («1 234,50»)
 * сервер не разберёт.
 */
export function NumberFieldHiddenInput(props: NumberFieldHiddenInputProps) {
  traceLife("ui.number-field-hidden-input");

  return <KobalteHiddenInput data-slot="number-field-hidden-input" {...props} />;
}

/**
 * Пропсы `NumberFieldIncrement`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type NumberFieldIncrementProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  NumberFieldIncrementTriggerProps<T>
>;

/**
 * Кнопка «больше» — ОДИН узел `<button>`.
 *
 * Имя слота `number-field-increment`, без слова `trigger`: действие уже названо, а лишнее
 * слово в зацепке ничего не различает — по той же причине, что и `popover-close`.
 *
 * Знак внутрь кладёт потребитель: своих иконок кит не привозит.
 */
export function NumberFieldIncrement<T extends ValidComponent = "button">(
  props: NumberFieldIncrementProps<T>,
) {
  traceLife("ui.number-field-increment");

  return (
    <KobalteIncrement
      data-slot="number-field-increment"
      {...(props as NumberFieldIncrementTriggerProps)}
    />
  );
}

/**
 * Пропсы `NumberFieldDecrement`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type NumberFieldDecrementProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  NumberFieldDecrementTriggerProps<T>
>;

/** Кнопка «меньше» — ОДИН узел `<button>`. */
export function NumberFieldDecrement<T extends ValidComponent = "button">(
  props: NumberFieldDecrementProps<T>,
) {
  traceLife("ui.number-field-decrement");

  return (
    <KobalteDecrement
      data-slot="number-field-decrement"
      {...(props as NumberFieldDecrementTriggerProps)}
    />
  );
}

/**
 * Пропсы `NumberFieldDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NumberFieldDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NumberFieldDescriptionProps<T>>;

/** Пояснение к полю — ОДИН узел; уходит в `aria-describedby` ввода. */
export function NumberFieldDescription<T extends ValidComponent = "div">(
  props: NumberFieldDescriptionComponentProps<T>,
) {
  traceLife("ui.number-field-description");

  return (
    <KobalteDescription
      data-slot="number-field-description"
      {...(props as NumberFieldDescriptionProps)}
    />
  );
}

/**
 * Пропсы `NumberFieldError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NumberFieldErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  NumberFieldErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function NumberFieldError<T extends ValidComponent = "div">(
  props: NumberFieldErrorProps<T>,
) {
  traceLife("ui.number-field-error");

  return (
    <KobalteErrorMessage
      data-slot="number-field-error"
      {...(props as NumberFieldErrorMessageProps)}
    />
  );
}
