import {
  Control as KobalteControl,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Indicator as KobalteIndicator,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteCheckbox,
  type CheckboxControlProps,
  type CheckboxDescriptionProps,
  type CheckboxErrorMessageProps,
  type CheckboxIndicatorProps,
  type CheckboxInputProps,
  type CheckboxLabelProps,
  type CheckboxRootProps,
} from "@kobalte/core/checkbox";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Семейство флажка. Семь частей в одном файле по той же причине, что и семейство поля: они не
// независимы — корень заводит контекст, остальные его читают.
//
// ## Почему семь частей, а не один `<Checkbox label="…" />`
//
// Потому что флажок нельзя одеть, не разобрав. Нативный `<input type=checkbox>` не
// стилизуется как надо ни в одном браузере — рынок решает это одинаково: настоящий ввод
// прячут (он несёт фокус, форму и доступность), а рисуют СОСЕДНИЙ узел. Значит узлов минимум
// три (`checkbox-input`, `checkbox-control`, `checkbox-indicator`), и все три обязаны быть
// зацепками, иначе оформление не доберётся до того, что видно.
//
// Разложение — kobalte'вское, мы его не придумывали и не сокращали: обёрнуть часть частей
// значило бы отдать зоне `skin` полусоставной примитив, у которого одета рамка и гола галочка.
//
// ## Цена, названная прямо: части требуют `Checkbox` вокруг
//
// Все шесть читают контекст и вне корня бросают ошибку — ровно как части `Field`. На этом
// контексте держатся связка `for`↔`id`, `aria-describedby`, `aria-invalid` и состояние
// `data-checked`, по которому оформление и рисует галочку.

/**
 * Пропсы `Checkbox` — корня флажка.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CheckboxProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CheckboxRootProps<T>
>;

/**
 * Корень флажка — ОДИН узел, по умолчанию `<div>`, плюс контекст для частей.
 *
 * Держит состояние (`checked` / `defaultChecked` / `onChange`, `indeterminate`), `disabled`,
 * `required`, `validationState`, `name` и `value` для формы. Разметку внутри задаёт
 * потребитель: порядок подписи, рамки и пояснения наш примитив не знает.
 *
 * Состояние приезжает атрибутами данных (`data-checked`, `data-indeterminate`,
 * `data-disabled`) — по ним и рисуют, без единого класса от нас.
 *
 * @example
 * ```tsx
 * <Checkbox checked={agreed()} onChange={setAgreed}>
 *   <CheckboxInput />
 *   <CheckboxControl>
 *     <CheckboxIndicator>✓</CheckboxIndicator>
 *   </CheckboxControl>
 *   <CheckboxLabel>Согласен</CheckboxLabel>
 * </Checkbox>
 * ```
 */
export function Checkbox<T extends ValidComponent = "div">(props: CheckboxProps<T>) {
  traceLife("ui.checkbox");

  return <KobalteCheckbox data-slot="checkbox" {...(props as CheckboxRootProps)} />;
}

/**
 * Пропсы `CheckboxInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type CheckboxInputComponentProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  CheckboxInputProps<T>
>;

/**
 * НАСТОЯЩИЙ `<input type="checkbox">` — ОДИН узел, и он не декоративный.
 *
 * Он несёт фокус, участие в форме и всё, что читает вспомогательная техника. Прячут его
 * оформлением (`opacity: 0` поверх рамки — норма рынка), а не отсутствием: убрать ввод и
 * рисовать `<div>` с `role="checkbox"` значит переписать доступность руками.
 */
export function CheckboxInput<T extends ValidComponent = "input">(
  props: CheckboxInputComponentProps<T>,
) {
  traceLife("ui.checkbox-input");

  return <KobalteInput data-slot="checkbox-input" {...(props as CheckboxInputProps)} />;
}

/**
 * Пропсы `CheckboxControl`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CheckboxControlComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CheckboxControlProps<T>
>;

/**
 * Видимая рамка флажка — ОДИН узел, на котором и держится всё оформление.
 *
 * Состояние корня приезжает сюда атрибутами данных, поэтому `[data-slot="checkbox-control"]`
 * плюс `[data-checked]` — это вся нужная оформлению опора.
 */
export function CheckboxControl<T extends ValidComponent = "div">(
  props: CheckboxControlComponentProps<T>,
) {
  traceLife("ui.checkbox-control");

  return <KobalteControl data-slot="checkbox-control" {...(props as CheckboxControlProps)} />;
}

/**
 * Пропсы `CheckboxIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CheckboxIndicatorComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CheckboxIndicatorProps<T>
>;

/**
 * Отметка внутри рамки — ОДИН узел, который kobalte рендерит ТОЛЬКО во включённом или
 * неопределённом состоянии.
 *
 * Саму галочку кладёт потребитель — иконкой или через CSS, как и в `SelectIcon`. Нужен узел,
 * который есть всегда (например, ради перехода), — это `forceMount` насквозь.
 */
export function CheckboxIndicator<T extends ValidComponent = "div">(
  props: CheckboxIndicatorComponentProps<T>,
) {
  traceLife("ui.checkbox-indicator");

  return <KobalteIndicator data-slot="checkbox-indicator" {...(props as CheckboxIndicatorProps)} />;
}

/**
 * Пропсы `CheckboxLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type CheckboxLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  CheckboxLabelProps<T>
>;

/** Подпись флажка — ОДИН узел `<label>`, связанный с вводом по контексту корня. */
export function CheckboxLabel<T extends ValidComponent = "label">(
  props: CheckboxLabelComponentProps<T>,
) {
  traceLife("ui.checkbox-label");

  return <KobalteLabel data-slot="checkbox-label" {...(props as CheckboxLabelProps)} />;
}

/**
 * Пропсы `CheckboxDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CheckboxDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CheckboxDescriptionProps<T>
>;

/** Пояснение к флажку — ОДИН узел; его идентификатор уходит в `aria-describedby` ввода. */
export function CheckboxDescription<T extends ValidComponent = "div">(
  props: CheckboxDescriptionComponentProps<T>,
) {
  traceLife("ui.checkbox-description");

  return (
    <KobalteDescription data-slot="checkbox-description" {...(props as CheckboxDescriptionProps)} />
  );
}

/**
 * Пропсы `CheckboxError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CheckboxErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CheckboxErrorMessageProps<T>
>;

/**
 * Сообщение об ошибке — ОДИН узел, который kobalte рендерит ТОЛЬКО при
 * `validationState="invalid"` у корня.
 *
 * Имя слота — `checkbox-error`, а не `checkbox-error-message`: в зоне уже опубликован
 * `field-error`, и одна и та же вещь обязана называться одинаково. Расхождение с именем части
 * kobalte здесь сознательное и стоит дешевле, чем два разных имени для одного смысла.
 */
export function CheckboxError<T extends ValidComponent = "div">(props: CheckboxErrorProps<T>) {
  traceLife("ui.checkbox-error");

  return (
    <KobalteErrorMessage data-slot="checkbox-error" {...(props as CheckboxErrorMessageProps)} />
  );
}
