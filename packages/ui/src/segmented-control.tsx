import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Indicator as KobalteIndicator,
  Item as KobalteItem,
  ItemControl as KobalteItemControl,
  ItemDescription as KobalteItemDescription,
  ItemIndicator as KobalteItemIndicator,
  ItemInput as KobalteItemInput,
  ItemLabel as KobalteItemLabel,
  Label as KobalteLabel,
  Root as KobalteSegmentedControl,
  type SegmentedControlDescriptionProps,
  type SegmentedControlErrorMessageProps,
  type SegmentedControlIndicatorProps,
  type SegmentedControlItemControlProps,
  type SegmentedControlItemDescriptionProps,
  type SegmentedControlItemIndicatorProps,
  type SegmentedControlItemInputProps,
  type SegmentedControlItemLabelProps,
  type SegmentedControlItemProps,
  type SegmentedControlRootProps,
} from "@kobalte/core/segmented-control";
// Подпись ГРУППЫ segmented-control — это часть `RadioGroup`: kobalte переиспользует её как
// есть и своего псевдонима типу не даёт. Берём тип оттуда, а не подсовываем похожий.
import type { RadioGroupLabelProps } from "@kobalte/core/radio-group";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Переключатель режимов в одну строку: «список / плитки / карта», «день / неделя / месяц».
//
// ## Это ГРУППА ВЫБОРА, а не набор кнопок — и разница не косметическая
//
// Внутри те же настоящие `<input type="radio">`, что и у `RadioGroup`: одно значение из
// нескольких, стрелки ходят по вариантам, форма получает значение. Собрать то же самое из
// `Toggle` было бы враньём для вспомогательной техники — она прочитала бы три независимые
// кнопки вместо одного выбора.
//
// Отличие от `RadioGroup` — только в показе: варианты стоят в ряд, а под активным ездит
// полоска-указатель. Поэтому части почти те же, плюс `segmented-control-indicator`.
//
// ## Дорожка — НАША часть, а не kobalte'вская, и вот зачем она понадобилась
//
// Полоску kobalte двигает трансформацией, считая `offsetLeft` выбранного варианта. Отсчёт идёт
// от ближайшего позиционированного предка, то есть от узла-обёртки вокруг вариантов. У kobalte
// такой части НЕТ: обёртку он оставляет потребителю — и оформление, написанное для всех
// потребителей сразу, не может её ни назвать, ни сделать позиционированной.
//
// Поставить `position: relative` на корень не выходит: корень включает подпись группы, и
// полоска уезжает вниз ровно на её высоту (замерено зоной `skin`).
//
// Поэтому `SegmentedControlTrack` — единственная часть семейства, которой у kobalte нет вовсе.
// Она не привозит ни поведения, ни стилей: это ОДИН узел с зацепкой, и всё.

/**
 * Пропсы `SegmentedControl` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SegmentedControlRootProps
>;

/**
 * Корень — ОДИН узел `[role=radiogroup]` плюс контекст для частей.
 *
 * @example
 * ```tsx
 * <SegmentedControl value={mode()} onChange={setMode}>
 *   <SegmentedControlIndicator />
 *   <For each={["список", "плитки"]}>
 *     {(value) => (
 *       <SegmentedControlItem value={value}>
 *         <SegmentedControlItemInput />
 *         <SegmentedControlItemControl>
 *           <SegmentedControlItemLabel>{value}</SegmentedControlItemLabel>
 *         </SegmentedControlItemControl>
 *       </SegmentedControlItem>
 *     )}
 *   </For>
 * </SegmentedControl>
 * ```
 */
export function SegmentedControl<T extends ValidComponent = "div">(
  props: SegmentedControlProps<T>,
) {
  traceLife("ui.segmented-control");

  return (
    <KobalteSegmentedControl
      data-slot="segmented-control"
      {...(props as SegmentedControlRootProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlTrack`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlTrackProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Дорожка — ОДИН узел вокруг вариантов и полоски.
 *
 * Оформление делает её позиционированной (`position: relative`), и от неё же kobalte считает
 * смещение полоски. Без этой части полоска отсчитывается от чужого начала координат и сползает.
 *
 * Своего поведения у неё нет: это чистая точка опоры для оформления.
 *
 * @example
 * ```tsx
 * <SegmentedControl value={mode()} onChange={setMode}>
 *   <SegmentedControlLabel>Показывать</SegmentedControlLabel>
 *   <SegmentedControlTrack>
 *     <SegmentedControlIndicator />
 *     <SegmentedControlItem value="список">…</SegmentedControlItem>
 *   </SegmentedControlTrack>
 * </SegmentedControl>
 * ```
 */
export function SegmentedControlTrack<T extends ValidComponent = "div">(
  props: SegmentedControlTrackProps<T>,
) {
  traceLife("ui.segmented-control-track");

  return <Polymorphic as="div" data-slot="segmented-control-track" {...props} />;
}

/**
 * Пропсы `SegmentedControlIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlIndicatorProps>;

/**
 * Полоска под активным вариантом — ОДИН узел.
 *
 * Размеры активного варианта считает kobalte и отдаёт их переменными CSS; двигать полоску,
 * рисовать её и решать, ехать ли ей плавно, — дело оформления.
 */
export function SegmentedControlIndicator<T extends ValidComponent = "div">(
  props: SegmentedControlIndicatorComponentProps<T>,
) {
  traceLife("ui.segmented-control-indicator");

  return (
    <KobalteIndicator
      data-slot="segmented-control-indicator"
      {...(props as SegmentedControlIndicatorProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlItemProps<T>>;

/** Один вариант — ОДИН узел плюс контекст своих частей. Обязателен проп `value`. */
export function SegmentedControlItem<T extends ValidComponent = "div">(
  props: SegmentedControlItemComponentProps<T>,
) {
  traceLife("ui.segmented-control-item");

  return (
    <KobalteItem data-slot="segmented-control-item" {...(props as SegmentedControlItemProps)} />
  );
}

/**
 * Пропсы `SegmentedControlItemInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type SegmentedControlItemInputComponentProps<T extends ValidComponent = "input"> =
  PolymorphicProps<T, SegmentedControlItemInputProps<T>>;

/** Настоящий `<input type="radio">` варианта — ОДИН узел: фокус, клавиатура, форма. */
export function SegmentedControlItemInput<T extends ValidComponent = "input">(
  props: SegmentedControlItemInputComponentProps<T>,
) {
  traceLife("ui.segmented-control-item-input");

  return (
    <KobalteItemInput
      data-slot="segmented-control-item-input"
      {...(props as SegmentedControlItemInputProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlItemControl`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlItemControlComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlItemControlProps<T>>;

/** Видимая часть варианта — ОДИН узел; её и оформляют как «кнопку» режима. */
export function SegmentedControlItemControl<T extends ValidComponent = "div">(
  props: SegmentedControlItemControlComponentProps<T>,
) {
  traceLife("ui.segmented-control-item-control");

  return (
    <KobalteItemControl
      data-slot="segmented-control-item-control"
      {...(props as SegmentedControlItemControlProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlItemIndicatorProps<T>>;

/** Отметка внутри выбранного варианта — ОДИН узел, только у выбранного. */
export function SegmentedControlItemIndicator<T extends ValidComponent = "div">(
  props: SegmentedControlItemIndicatorComponentProps<T>,
) {
  traceLife("ui.segmented-control-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="segmented-control-item-indicator"
      {...(props as SegmentedControlItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type SegmentedControlItemLabelComponentProps<T extends ValidComponent = "label"> =
  PolymorphicProps<T, SegmentedControlItemLabelProps<T>>;

/** Подпись варианта — ОДИН узел `<label>`, связанный со своим вводом. */
export function SegmentedControlItemLabel<T extends ValidComponent = "label">(
  props: SegmentedControlItemLabelComponentProps<T>,
) {
  traceLife("ui.segmented-control-item-label");

  return (
    <KobalteItemLabel
      data-slot="segmented-control-item-label"
      {...(props as SegmentedControlItemLabelProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlItemDescriptionProps<T>>;

/** Пояснение к одному варианту — ОДИН узел. */
export function SegmentedControlItemDescription<T extends ValidComponent = "div">(
  props: SegmentedControlItemDescriptionComponentProps<T>,
) {
  traceLife("ui.segmented-control-item-description");

  return (
    <KobalteItemDescription
      data-slot="segmented-control-item-description"
      {...(props as SegmentedControlItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type SegmentedControlLabelComponentProps<T extends ValidComponent = "span"> =
  PolymorphicProps<T, RadioGroupLabelProps<T>>;

/** Подпись ГРУППЫ — ОДИН узел `<span>`; уходит в `aria-labelledby` корня. */
export function SegmentedControlLabel<T extends ValidComponent = "span">(
  props: SegmentedControlLabelComponentProps<T>,
) {
  traceLife("ui.segmented-control-label");

  return (
    <KobalteLabel
      data-slot="segmented-control-label"
      {...(props as RadioGroupLabelProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, SegmentedControlDescriptionProps<T>>;

/** Пояснение к группе — ОДИН узел. */
export function SegmentedControlDescription<T extends ValidComponent = "div">(
  props: SegmentedControlDescriptionComponentProps<T>,
) {
  traceLife("ui.segmented-control-description");

  return (
    <KobalteDescription
      data-slot="segmented-control-description"
      {...(props as SegmentedControlDescriptionProps)}
    />
  );
}

/**
 * Пропсы `SegmentedControlError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SegmentedControlErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SegmentedControlErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function SegmentedControlError<T extends ValidComponent = "div">(
  props: SegmentedControlErrorProps<T>,
) {
  traceLife("ui.segmented-control-error");

  return (
    <KobalteErrorMessage
      data-slot="segmented-control-error"
      {...(props as SegmentedControlErrorMessageProps)}
    />
  );
}
