import {
  type ColorFieldDescriptionProps,
  type ColorFieldErrorMessageProps,
  type ColorFieldInputProps,
  type ColorFieldLabelProps,
  type ColorFieldRootProps,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteColorField,
} from "@kobalte/core/color-field";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Ввод цвета СТРОКОЙ: семя пресета оформления, свой бренд одним значением.
//
// ## Почему это не `<Input>` с проверкой у потребителя
//
// Значение здесь не «текст, похожий на цвет», а шестнадцатеричный цвет, и три вещи ниже
// потребителю пришлось бы написать самому — одинаково и в каждом месте, где цвет вводят:
//
//   • в поле НЕ ПОПАДАЮТ посторонние знаки: разрешён `#` и до шести цифр `0-9a-f`, остальное
//     не печатается вовсе, а не подсвечивается ошибкой после;
//   • на уходе фокуса значение ПРИВОДИТСЯ к `#RRGGBB` — «f00» и «F00» становятся `#FF0000`
//     (буквы ПРОПИСНЫЕ — так пишет `@kobalte/core`; сравнивать значения строкой без учёта
//     регистра обязан потребитель, порт написание не меняет);
//   • неразобранное на уходе фокуса ОТКАТЫВАЕТСЯ к прежнему, а не оставляет поле с мусором.
//
// ## Значение — строка, а не объект цвета
//
// Единственный из трёх цветовых примитивов, которому объект `Color` не нужен ни на входе, ни
// на выходе: `value` / `onChange` работают с обычной строкой. Ввести акцент, положить его в
// пресет и прочитать обратно можно, не зная про цветовые модели вообще.
//
// Формат ровно один — HEX, и это решение `@kobalte/core`, не наше: `rgb(…)` и `hsl(…)` в поле
// не наберутся. Порт его не расширяет — обёртка, добавляющая свои форматы, перестала бы быть
// портом и стала бы вторым источником правды о том, что такое цвет.

/**
 * Пропсы `ColorField` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorFieldProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorFieldRootProps<T>
>;

/**
 * Корень поля цвета — ОДИН узел плюс контекст для частей.
 *
 * Держит значение (`value` / `defaultValue` / `onChange` — строкой) и состояние поля
 * (`validationState`, `required`, `disabled`, `readOnly`, `name`).
 *
 * @example
 * ```tsx
 * <ColorField value={accent()} onChange={setAccent}>
 *   <ColorFieldLabel>Акцент</ColorFieldLabel>
 *   <ColorFieldInput />
 *   <ColorFieldDescription>Шестнадцатеричный, например #2f6fed</ColorFieldDescription>
 * </ColorField>
 * ```
 */
export function ColorField<T extends ValidComponent = "div">(props: ColorFieldProps<T>) {
  traceLife("ui.color-field");

  return <KobalteColorField data-slot="color-field" {...(props as ColorFieldRootProps)} />;
}

/**
 * Пропсы `ColorFieldLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type ColorFieldLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  ColorFieldLabelProps<T>
>;

/** Подпись поля — ОДИН узел `<label>`, связанный с вводом по контексту корня. */
export function ColorFieldLabel<T extends ValidComponent = "label">(
  props: ColorFieldLabelComponentProps<T>,
) {
  traceLife("ui.color-field-label");

  return <KobalteLabel data-slot="color-field-label" {...(props as ColorFieldLabelProps)} />;
}

/**
 * Пропсы `ColorFieldInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type ColorFieldInputComponentProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  ColorFieldInputProps<T>
>;

/**
 * Ввод — ОДИН узел `<input>`; в нём и живёт вся механика формата.
 *
 * Приезжает с `autocomplete="off"`, `autocorrect="off"` и `spellcheck="false"`: подсказка
 * браузера и проверка правописания на шестнадцатеричном коде мешают, а не помогают. Это
 * атрибуты `@kobalte/core`, и они перебиваются пропсом потребителя, как любой другой.
 *
 * `onBlur` потребителя вызывается ВМЕСТЕ с внутренним (тем, что приводит значение к `#rrggbb`),
 * а не вместо него.
 */
export function ColorFieldInput<T extends ValidComponent = "input">(
  props: ColorFieldInputComponentProps<T>,
) {
  traceLife("ui.color-field-input");

  return <KobalteInput data-slot="color-field-input" {...(props as ColorFieldInputProps)} />;
}

/**
 * Пропсы `ColorFieldDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorFieldDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ColorFieldDescriptionProps<T>>;

/** Пояснение к полю — ОДИН узел; уходит в `aria-describedby` ввода. */
export function ColorFieldDescription<T extends ValidComponent = "div">(
  props: ColorFieldDescriptionComponentProps<T>,
) {
  traceLife("ui.color-field-description");

  return (
    <KobalteDescription
      data-slot="color-field-description"
      {...(props as ColorFieldDescriptionProps)}
    />
  );
}

/**
 * Пропсы `ColorFieldError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorFieldErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorFieldErrorMessageProps<T>
>;

/**
 * Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`.
 *
 * Про формат оно не нужно: неразобранное значение поле откатывает само. Сюда пишут то, чего
 * примитиву знать неоткуда, — «слишком светлый для текста», «занят другой ступенью».
 */
export function ColorFieldError<T extends ValidComponent = "div">(props: ColorFieldErrorProps<T>) {
  traceLife("ui.color-field-error");

  return (
    <KobalteErrorMessage data-slot="color-field-error" {...(props as ColorFieldErrorMessageProps)} />
  );
}
