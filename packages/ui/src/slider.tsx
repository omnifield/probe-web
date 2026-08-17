import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Fill as KobalteFill,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteSlider,
  type SliderDescriptionProps,
  type SliderErrorMessageProps,
  type SliderFillProps,
  type SliderInputProps,
  type SliderLabelProps,
  type SliderRootProps,
  type SliderThumbProps,
  type SliderTrackProps,
  type SliderValueLabelProps,
  Thumb as KobalteThumb,
  Track as KobalteTrack,
  ValueLabel as KobalteValueLabel,
} from "@kobalte/core/slider";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Ползунок: числовой диапазон фильтра, прозрачность слоя карты, масштаб.
//
// ## Дорожка, заливка и бегунок — три части, и меньше не выйдет
//
// Дорожка это весь путь, заливка — пройденная часть, бегунок — то, что тянут. Свести их в один
// узел нельзя: заливка меняет ширину, бегунок ездит, а дорожка стоит. Псевдоэлементами это
// делают ровно до первого диапазона из двух бегунков.
//
// ## Диапазон — это ДВА бегунка внутри одного корня
//
// `value={[10, 90]}` и два `<SliderThumb>` — фильтр «от и до» собирается без второго
// примитива. Именно поэтому бегунок отдельная часть, а не проп корня.

/**
 * Пропсы `Slider` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderProps<T extends ValidComponent = "div"> = PolymorphicProps<T, SliderRootProps<T>>;

/**
 * Корень ползунка — ОДИН узел плюс контекст для частей.
 *
 * Держит значение (`value` / `defaultValue` / `onChange` / `onChangeEnd`), границы
 * (`minValue`, `maxValue`, `step`), ориентацию и `getValueLabel`.
 *
 * @example
 * ```tsx
 * <Slider value={[range().from, range().to]} onChange={setRange} minValue={0} maxValue={100}>
 *   <SliderLabel>Цена</SliderLabel>
 *   <SliderValueLabel />
 *   <SliderTrack>
 *     <SliderFill />
 *     <SliderThumb><SliderInput /></SliderThumb>
 *     <SliderThumb><SliderInput /></SliderThumb>
 *   </SliderTrack>
 * </Slider>
 * ```
 */
export function Slider<T extends ValidComponent = "div">(props: SliderProps<T>) {
  traceLife("ui.slider");

  return <KobalteSlider data-slot="slider" {...(props as SliderRootProps)} />;
}

/**
 * Пропсы `SliderLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type SliderLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  SliderLabelProps<T>
>;

/** Подпись ползунка — ОДИН узел. */
export function SliderLabel<T extends ValidComponent = "label">(
  props: SliderLabelComponentProps<T>,
) {
  traceLife("ui.slider-label");

  return <KobalteLabel data-slot="slider-label" {...(props as SliderLabelProps)} />;
}

/**
 * Пропсы `SliderValueLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderValueLabelComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SliderValueLabelProps<T>
>;

/**
 * Текущее значение текстом — ОДИН узел.
 *
 * Как именно его писать («10 — 90», «10 ₽»), решает `getValueLabel` на корне: формат зависит
 * от предметной области, и встроенный был бы неверным ровно там, где важен.
 */
export function SliderValueLabel<T extends ValidComponent = "div">(
  props: SliderValueLabelComponentProps<T>,
) {
  traceLife("ui.slider-value-label");

  return <KobalteValueLabel data-slot="slider-value-label" {...(props as SliderValueLabelProps)} />;
}

/**
 * Пропсы `SliderTrack`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderTrackComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SliderTrackProps<T>
>;

/** Дорожка — ОДИН узел; внутри неё живут заливка и бегунки. */
export function SliderTrack<T extends ValidComponent = "div">(
  props: SliderTrackComponentProps<T>,
) {
  traceLife("ui.slider-track");

  return <KobalteTrack data-slot="slider-track" {...(props as SliderTrackProps)} />;
}

/**
 * Пропсы `SliderFill`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderFillComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SliderFillProps<T>
>;

/**
 * Пройденная часть дорожки — ОДИН узел.
 *
 * Ширину (или высоту) считает kobalte и пишет инлайновым стилем: она зависит от значения, а
 * значение знает только он. Цвет и скругление — оформление потребителя.
 */
export function SliderFill<T extends ValidComponent = "div">(props: SliderFillComponentProps<T>) {
  traceLife("ui.slider-fill");

  return <KobalteFill data-slot="slider-fill" {...(props as SliderFillProps)} />;
}

/**
 * Пропсы `SliderThumb`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type SliderThumbComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  SliderThumbProps<T>
>;

/**
 * Бегунок — ОДИН узел `<span role="slider">`; его положение считает kobalte.
 *
 * Бегунков столько, сколько значений в `value`: один для числа, два для диапазона.
 */
export function SliderThumb<T extends ValidComponent = "span">(
  props: SliderThumbComponentProps<T>,
) {
  traceLife("ui.slider-thumb");

  return <KobalteThumb data-slot="slider-thumb" {...(props as SliderThumbProps)} />;
}

/**
 * Настоящий `<input type="range">` внутри бегунка — ОДИН узел.
 *
 * Он несёт фокус, клавиатуру и форму; спрятан той же механикой, что и вводы флажка. Ставится
 * ВНУТРЬ `SliderThumb` — иначе браузер не свяжет их.
 */
export function SliderInput(props: SliderInputProps) {
  traceLife("ui.slider-input");

  return <KobalteInput data-slot="slider-input" {...props} />;
}

/**
 * Пропсы `SliderDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SliderDescriptionProps<T>
>;

/** Пояснение — ОДИН узел; уходит в `aria-describedby`. */
export function SliderDescription<T extends ValidComponent = "div">(
  props: SliderDescriptionComponentProps<T>,
) {
  traceLife("ui.slider-description");

  return (
    <KobalteDescription data-slot="slider-description" {...(props as SliderDescriptionProps)} />
  );
}

/**
 * Пропсы `SliderError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SliderErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SliderErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function SliderError<T extends ValidComponent = "div">(props: SliderErrorProps<T>) {
  traceLife("ui.slider-error");

  return <KobalteErrorMessage data-slot="slider-error" {...(props as SliderErrorMessageProps)} />;
}
