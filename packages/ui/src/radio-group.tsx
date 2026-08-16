import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Item as KobalteItem,
  ItemControl as KobalteItemControl,
  ItemDescription as KobalteItemDescription,
  ItemIndicator as KobalteItemIndicator,
  ItemInput as KobalteItemInput,
  ItemLabel as KobalteItemLabel,
  Label as KobalteLabel,
  type RadioGroupDescriptionProps,
  type RadioGroupErrorMessageProps,
  type RadioGroupItemControlProps,
  type RadioGroupItemDescriptionProps,
  type RadioGroupItemIndicatorProps,
  type RadioGroupItemInputProps,
  type RadioGroupItemLabelProps,
  type RadioGroupItemProps,
  type RadioGroupLabelProps,
  type RadioGroupRootProps,
  Root as KobalteRadioGroup,
} from "@kobalte/core/radio-group";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Семейство группы переключателей. Десять частей — самое разложенное семейство зоны, и это
// не избыточность: у него ДВА уровня контекста, групповой и вариантный.
//
//   • Групповой уровень (`radio-group`, `radio-group-label`, `radio-group-description`,
//     `radio-group-error`) — общее для всех вариантов: значение, `name`, ошибка группы.
//   • Вариантный (`radio-group-item*`) — свой ввод, своя рамка, своя подпись у КАЖДОГО
//     варианта. Это ровно то же разложение, что у флажка, повторённое внутри группы.
//
// Одним компонентом с пропсом `options` это не собирается: разметку варианта задаёт
// потребитель, и именно поэтому она у него получается любой — от списка до плиток.
//
// ## Почему имена длинные
//
// `radio-group-item-label`, а не `radio-item-label`: имя слота повторяет путь части у
// kobalte, и предсказуемость здесь важнее краткости. То же правило уже действует в `Select`
// (`select-item-label`), и разнобой стоил бы дороже, чем четыре лишних символа.

/**
 * Пропсы `RadioGroup` — корня группы.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  RadioGroupRootProps<T>
>;

/**
 * Корень группы — ОДИН узел `<div role="radiogroup">` плюс контекст для частей.
 *
 * Держит выбранное значение (`value` / `defaultValue` / `onChange`), `name`, `orientation`,
 * `disabled`, `required` и `validationState`. Стрелками по вариантам ходит kobalte — это
 * поведение группы, а не наша надстройка.
 *
 * @example
 * ```tsx
 * <RadioGroup value={size()} onChange={setSize}>
 *   <RadioGroupLabel>Размер</RadioGroupLabel>
 *   <For each={["S", "M", "L"]}>
 *     {(value) => (
 *       <RadioGroupItem value={value}>
 *         <RadioGroupItemInput />
 *         <RadioGroupItemControl>
 *           <RadioGroupItemIndicator />
 *         </RadioGroupItemControl>
 *         <RadioGroupItemLabel>{value}</RadioGroupItemLabel>
 *       </RadioGroupItem>
 *     )}
 *   </For>
 * </RadioGroup>
 * ```
 */
export function RadioGroup<T extends ValidComponent = "div">(props: RadioGroupProps<T>) {
  traceLife("ui.radio-group");

  return <KobalteRadioGroup data-slot="radio-group" {...(props as RadioGroupRootProps)} />;
}

/**
 * Пропсы `RadioGroupLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type RadioGroupLabelComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  RadioGroupLabelProps<T>
>;

/**
 * Подпись ГРУППЫ — ОДИН узел `<span>`, а не `<label>`.
 *
 * Тег здесь не оплошность kobalte: `<label>` связывается с одним элементом, а подпись группы
 * относится ко всем вариантам сразу и уезжает в `aria-labelledby` корня.
 */
export function RadioGroupLabel<T extends ValidComponent = "span">(
  props: RadioGroupLabelComponentProps<T>,
) {
  traceLife("ui.radio-group-label");

  return <KobalteLabel data-slot="radio-group-label" {...(props as RadioGroupLabelProps)} />;
}

/**
 * Пропсы `RadioGroupDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, RadioGroupDescriptionProps<T>>;

/** Пояснение к группе — ОДИН узел; его идентификатор уходит в `aria-describedby` корня. */
export function RadioGroupDescription<T extends ValidComponent = "div">(
  props: RadioGroupDescriptionComponentProps<T>,
) {
  traceLife("ui.radio-group-description");

  return (
    <KobalteDescription
      data-slot="radio-group-description"
      {...(props as RadioGroupDescriptionProps)}
    />
  );
}

/**
 * Пропсы `RadioGroupError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  RadioGroupErrorMessageProps<T>
>;

/**
 * Ошибка ГРУППЫ — ОДИН узел, только при `validationState="invalid"` у корня.
 *
 * Имя слота `radio-group-error` — как `field-error` и `checkbox-error`.
 */
export function RadioGroupError<T extends ValidComponent = "div">(
  props: RadioGroupErrorProps<T>,
) {
  traceLife("ui.radio-group-error");

  return (
    <KobalteErrorMessage data-slot="radio-group-error" {...(props as RadioGroupErrorMessageProps)} />
  );
}

/**
 * Пропсы `RadioGroupItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  RadioGroupItemProps<T>
>;

/**
 * Один вариант — ОДИН узел плюс контекст для своих частей. Обязателен проп `value`.
 *
 * Состояние варианта приезжает атрибутами данных (`data-checked`, `data-disabled`), поэтому
 * оформлению не нужно знать ни про какой класс.
 */
export function RadioGroupItem<T extends ValidComponent = "div">(
  props: RadioGroupItemComponentProps<T>,
) {
  traceLife("ui.radio-group-item");

  return <KobalteItem data-slot="radio-group-item" {...(props as RadioGroupItemProps)} />;
}

/**
 * Пропсы `RadioGroupItemInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type RadioGroupItemInputComponentProps<T extends ValidComponent = "input"> =
  PolymorphicProps<T, RadioGroupItemInputProps<T>>;

/** Настоящий `<input type="radio">` варианта — ОДИН узел: фокус, форма, доступность. */
export function RadioGroupItemInput<T extends ValidComponent = "input">(
  props: RadioGroupItemInputComponentProps<T>,
) {
  traceLife("ui.radio-group-item-input");

  return (
    <KobalteItemInput data-slot="radio-group-item-input" {...(props as RadioGroupItemInputProps)} />
  );
}

/**
 * Пропсы `RadioGroupItemControl`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupItemControlComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, RadioGroupItemControlProps<T>>;

/** Видимая рамка варианта — ОДИН узел; внутри неё живёт отметка. */
export function RadioGroupItemControl<T extends ValidComponent = "div">(
  props: RadioGroupItemControlComponentProps<T>,
) {
  traceLife("ui.radio-group-item-control");

  return (
    <KobalteItemControl
      data-slot="radio-group-item-control"
      {...(props as RadioGroupItemControlProps)}
    />
  );
}

/**
 * Пропсы `RadioGroupItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, RadioGroupItemIndicatorProps<T>>;

/**
 * Отметка выбранного варианта — ОДИН узел, который kobalte рендерит ТОЛЬКО у выбранного.
 *
 * Нужен узел, который есть всегда (например, ради перехода), — это `forceMount` насквозь, как
 * и у `CheckboxIndicator`.
 */
export function RadioGroupItemIndicator<T extends ValidComponent = "div">(
  props: RadioGroupItemIndicatorComponentProps<T>,
) {
  traceLife("ui.radio-group-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="radio-group-item-indicator"
      {...(props as RadioGroupItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `RadioGroupItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type RadioGroupItemLabelComponentProps<T extends ValidComponent = "label"> =
  PolymorphicProps<T, RadioGroupItemLabelProps<T>>;

/** Подпись варианта — ОДИН узел `<label>`, связанный со своим вводом. */
export function RadioGroupItemLabel<T extends ValidComponent = "label">(
  props: RadioGroupItemLabelComponentProps<T>,
) {
  traceLife("ui.radio-group-item-label");

  return (
    <KobalteItemLabel data-slot="radio-group-item-label" {...(props as RadioGroupItemLabelProps)} />
  );
}

/**
 * Пропсы `RadioGroupItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type RadioGroupItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, RadioGroupItemDescriptionProps<T>>;

/**
 * Пояснение к ОДНОМУ варианту — ОДИН узел.
 *
 * Отдельная часть, а не текст внутри подписи: попав в `<label>`, пояснение было бы прочитано
 * как часть имени варианта.
 */
export function RadioGroupItemDescription<T extends ValidComponent = "div">(
  props: RadioGroupItemDescriptionComponentProps<T>,
) {
  traceLife("ui.radio-group-item-description");

  return (
    <KobalteItemDescription
      data-slot="radio-group-item-description"
      {...(props as RadioGroupItemDescriptionProps)}
    />
  );
}
