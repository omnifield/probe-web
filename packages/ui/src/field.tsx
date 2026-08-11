import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteField,
  TextArea as KobalteTextArea,
  type TextFieldDescriptionProps,
  type TextFieldErrorMessageProps,
  type TextFieldInputProps,
  type TextFieldLabelProps,
  type TextFieldRootProps,
  type TextFieldTextAreaProps,
} from "@kobalte/core/text-field";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Семейство текстового поля. Пять примитивов в одном файле, потому что они не независимы:
// `Field` заводит контекст, остальные его читают, и разнести их по файлам значило бы
// спрятать эту связь от читателя.
//
// ## Почему части, а не один компонент с пропсами `label` / `error`
//
// Один компонент пришлось бы решать за потребителя порядок узлов, обёртки и место ошибки —
// то есть ровно то, что контракт зоны запрещает. Разложенное на части поле каждый собирает
// сам, и КАЖДАЯ часть остаётся 1-to-1: `Field` — один `<div>`, `Label` — один `<label>`,
// `Input` — один `<input>`. Это декомпозиция самого kobalte, мы её не придумывали.
//
// ## Цена, названная прямо: части требуют `Field` вокруг
//
// `Label` / `Input` / `Textarea` / `FieldDescription` / `FieldError` читают контекст kobalte и
// ВНЕ `Field` бросают ошибку — «`useFormControlContext` must be used within a
// `FormControlContext.Provider`». Это не наш дефект и не обходится обёрткой: связка
// `for`↔`id`, `aria-describedby`, `aria-invalid` и `required` держится ровно на этом
// контексте, а нативный `<label>` без контекста не связан ни с чем.
//
// Автономный `<label>` без поля — это нативный `<label>`, а не наш примитив: заводить ради
// него второй компонент значило бы иметь две разные `Label` с расходящимся поведением.

/**
 * Пропсы `Field` — корня поля: значение, состояние и связка идентификаторов.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type FieldProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TextFieldRootProps<T>
>;

/**
 * Корень текстового поля — ОДИН узел, по умолчанию `<div>`, плюс контекст для частей.
 *
 * Он и держит всё, что у поля общего: значение (`value` / `defaultValue` / `onChange`),
 * `disabled`, `readOnly`, `required`, `validationState`, и раздаёт частям связанные
 * идентификаторы. Разметку внутри задаёт потребитель — порядок частей наш примитив не знает.
 *
 * @example
 * ```tsx
 * <Field value={mail()} onChange={setMail} validationState={ok() ? "valid" : "invalid"}>
 *   <Label>Почта</Label>
 *   <Input type="email" />
 *   <FieldError>Не похоже на адрес</FieldError>
 * </Field>
 * ```
 */
export function Field<T extends ValidComponent = "div">(props: FieldProps<T>) {
  traceLife("ui.field");

  return <KobalteField data-slot="field" {...(props as TextFieldRootProps)} />;
}

/**
 * Пропсы `Label`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type LabelProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  TextFieldLabelProps<T>
>;

/**
 * Подпись поля — ОДИН узел `<label>`; атрибут `for` проставляется из контекста `Field`.
 *
 * Требует `Field` вокруг — почему, написано в шапке файла.
 */
export function Label<T extends ValidComponent = "label">(props: LabelProps<T>) {
  traceLife("ui.label");

  return <KobalteLabel data-slot="label" {...(props as TextFieldLabelProps)} />;
}

/**
 * Пропсы `Input`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type InputProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  TextFieldInputProps<T>
>;

/**
 * Однострочный ввод — ОДИН узел `<input>`, связанный с `Field` по контексту.
 *
 * Из контекста приезжают `id`, `name`, `disabled`, `readOnly`, `required`, `aria-describedby`
 * и `aria-invalid`. Значение тоже: управляемым полем владеет `Field`, а не `Input`.
 *
 * **`data-filled` здесь НЕТ**, в отличие от оракула: там примитив держал свой сигнал и
 * подменял пользовательский `onInput`, чтобы этот сигнал обновлять. Обработчик потребителя
 * при этом переставал быть первым, а `type` по умолчанию затирался — цена атрибута, который
 * нужен был одному CSS-правилу. Пустоту поля потребитель видит и без нас: `:placeholder-shown`.
 */
export function Input<T extends ValidComponent = "input">(props: InputProps<T>) {
  traceLife("ui.input");

  return <KobalteInput data-slot="input" {...(props as TextFieldInputProps)} />;
}

/**
 * Пропсы `Textarea`.
 *
 * @typeParam T — что рендерить. По умолчанию `textarea`.
 */
export type TextareaProps<T extends ValidComponent = "textarea"> = PolymorphicProps<
  T,
  TextFieldTextAreaProps<T>
>;

/**
 * Многострочный ввод — ОДИН узел `<textarea>`, связанный с `Field` по контексту.
 *
 * `autoResize` из kobalte доступен насквозь: он не рисует, а меняет высоту под содержимое.
 */
export function Textarea<T extends ValidComponent = "textarea">(props: TextareaProps<T>) {
  traceLife("ui.textarea");

  return <KobalteTextArea data-slot="textarea" {...(props as TextFieldTextAreaProps)} />;
}

/**
 * Пропсы `FieldDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type FieldDescriptionProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TextFieldDescriptionProps<T>
>;

/**
 * Пояснение к полю — ОДИН узел; его идентификатор попадает в `aria-describedby` ввода.
 *
 * Без него подсказка под полем остаётся текстом, который скринридер не связывает с вводом.
 */
export function FieldDescription<T extends ValidComponent = "div">(
  props: FieldDescriptionProps<T>,
) {
  traceLife("ui.field-description");

  return (
    <KobalteDescription data-slot="field-description" {...(props as TextFieldDescriptionProps)} />
  );
}

/**
 * Пропсы `FieldError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type FieldErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TextFieldErrorMessageProps<T>
>;

/**
 * Сообщение об ошибке — ОДИН узел, который kobalte рендерит ТОЛЬКО при
 * `validationState="invalid"` у `Field`.
 *
 * Списка ошибок и разметки `<ul>` внутри нет, в отличие от оракула: несколько сообщений —
 * это несколько узлов, и собирает их потребитель.
 */
export function FieldError<T extends ValidComponent = "div">(props: FieldErrorProps<T>) {
  traceLife("ui.field-error");

  return <KobalteErrorMessage data-slot="field-error" {...(props as TextFieldErrorMessageProps)} />;
}
