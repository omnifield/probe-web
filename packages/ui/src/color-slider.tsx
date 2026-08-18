import {
  type ColorSliderDescriptionProps,
  type ColorSliderErrorMessageProps,
  type ColorSliderInputProps,
  type ColorSliderLabelProps,
  type ColorSliderRootProps,
  type ColorSliderThumbProps,
  type ColorSliderTrackProps,
  type ColorSliderValueLabelProps,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  Input as KobalteInput,
  Label as KobalteLabel,
  Root as KobalteColorSlider,
  Thumb as KobalteThumb,
  Track as KobalteTrack,
  ValueLabel as KobalteValueLabel,
} from "@kobalte/core/color-slider";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Ползунок ОДНОГО канала цвета: тон, насыщенность, прозрачность.
//
// ## Почему это не `Slider` с раскрашенной дорожкой
//
// Различий три, и все они в поведении, а не в виде:
//
//   • дорожка показывает ГРАДИЕНТ канала — те цвета, между которыми выбирают. Считается он из
//     текущего значения (у тона это радуга, у насыщенности — от серого к цвету ИМЕННО этого
//     тона), и знает его только примитив;
//   • границы и шаг берутся из канала, а не из пропсов: у тона это 0…360, у прозрачности 0…1.
//     `minValue` / `maxValue` / `step` здесь не нужны и не приняты;
//   • бегунок объявляет вспомогательной технике НАЗВАНИЕ цвета («200, синий»), а не число.
//
// Собрать это на `Slider` можно только повторив цветовую модель у себя — то есть заведя второй
// источник правды о том, что такое цвет.
//
// ## Проп `channel` ОБЯЗАТЕЛЕН
//
// Без него неизвестно, что примитив меняет, и градиента дорожки не существует. Пары
// «пространство + канал» разложены `@kobalte/core`: `channel="hue"` живёт в `hsl`/`hsb`,
// `channel="red"` — в `rgb`. Несуществующая пара — ошибка на рендере, а не молчаливый ноль.
//
// ## Значение — объект `Color`, а не число
//
// `value` / `defaultValue` / `onChange` работают с `Color` из `@kobalte/core/colors`: ползунок
// меняет ОДИН канал, а отдаёт цвет целиком — иначе его нельзя было бы связать с областью
// (`ColorArea`) и с полем (`ColorField`), которые смотрят на то же значение.

/**
 * Пропсы `ColorSlider` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorSliderProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorSliderRootProps<T>
>;

/**
 * Корень ползунка — ОДИН узел плюс контекст для частей.
 *
 * Держит значение (`value` / `defaultValue` / `onChange` / `onChangeEnd`), канал (`channel` —
 * обязателен, `colorSpace`), ориентацию, `getValueLabel` и состояние поля.
 *
 * @example
 * ```tsx
 * <ColorSlider channel="hue" value={color()} onChange={setColor}>
 *   <ColorSliderLabel>Тон</ColorSliderLabel>
 *   <ColorSliderValueLabel />
 *   <ColorSliderTrack>
 *     <ColorSliderThumb>
 *       <ColorSliderInput />
 *     </ColorSliderThumb>
 *   </ColorSliderTrack>
 * </ColorSlider>
 * ```
 */
export function ColorSlider<T extends ValidComponent = "div">(props: ColorSliderProps<T>) {
  traceLife("ui.color-slider");

  return <KobalteColorSlider data-slot="color-slider" {...(props as ColorSliderRootProps)} />;
}

/**
 * Пропсы `ColorSliderLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type ColorSliderLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  ColorSliderLabelProps<T>
>;

/** Подпись ползунка — ОДИН узел. */
export function ColorSliderLabel<T extends ValidComponent = "label">(
  props: ColorSliderLabelComponentProps<T>,
) {
  traceLife("ui.color-slider-label");

  return <KobalteLabel data-slot="color-slider-label" {...(props as ColorSliderLabelProps)} />;
}

/**
 * Пропсы `ColorSliderValueLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorSliderValueLabelComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ColorSliderValueLabelProps<T>>;

/**
 * Текущее значение текстом — ОДИН узел.
 *
 * По умолчанию это значение канала в человекочитаемом виде («200°», «45 %»). Своё написание
 * задаёт `getValueLabel` на корне — он получает весь цвет, а не одно число.
 */
export function ColorSliderValueLabel<T extends ValidComponent = "div">(
  props: ColorSliderValueLabelComponentProps<T>,
) {
  traceLife("ui.color-slider-value-label");

  return (
    <KobalteValueLabel
      data-slot="color-slider-value-label"
      {...(props as ColorSliderValueLabelProps)}
    />
  );
}

/**
 * Пропсы `ColorSliderTrack`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorSliderTrackComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorSliderTrackProps<T>
>;

/**
 * Дорожка — ОДИН узел; она же и есть показ выбора.
 *
 * **Названное отступление от «ноль стилей».** `@kobalte/core` пишет сюда инлайновый
 * `background: linear-gradient(…)`, посчитанный из канала и текущего значения. Это не вид, а
 * данные: дорожка обязана показывать те цвета, между которыми выбирают, а знает их только
 * примитив. Направление градиента следует ориентации и направлению письма — оформлению,
 * написанному один раз, этого не выразить.
 *
 * Заливки (`slider-fill`) здесь НЕТ и она не нужна: «пройденной части» у цветового канала не
 * бывает — дорожка целиком значима на всём протяжении.
 *
 * Стиль потребителя сливается с нашим: высота, скругление и рамка пишутся как обычно.
 */
export function ColorSliderTrack<T extends ValidComponent = "div">(
  props: ColorSliderTrackComponentProps<T>,
) {
  traceLife("ui.color-slider-track");

  return <KobalteTrack data-slot="color-slider-track" {...(props as ColorSliderTrackProps)} />;
}

/**
 * Пропсы `ColorSliderThumb`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ColorSliderThumbComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ColorSliderThumbProps<T>
>;

/**
 * Бегунок — ОДИН узел `[role=slider]`; его положение считает `@kobalte/core`.
 *
 * Инлайновым стилем приезжают положение и переменная `--kb-color-current` с выбранным цветом:
 * **по ней оформление красит сам бегунок** (`background: var(--kb-color-current)`), не разбирая
 * цветовые модели.
 *
 * `aria-valuetext` несёт НАЗВАНИЕ цвета, а не только число, — иначе «240» ничего не сообщает.
 */
export function ColorSliderThumb<T extends ValidComponent = "span">(
  props: ColorSliderThumbComponentProps<T>,
) {
  traceLife("ui.color-slider-thumb");

  return <KobalteThumb data-slot="color-slider-thumb" {...(props as ColorSliderThumbProps)} />;
}

/**
 * Настоящий `<input type="range">` внутри бегунка — ОДИН узел.
 *
 * Он несёт фокус, клавиатуру и форму; спрятан той же механикой, что и вводы флажка. Ставится
 * ВНУТРЬ `ColorSliderThumb` — иначе браузер не свяжет их.
 */
export function ColorSliderInput(props: ColorSliderInputProps) {
  traceLife("ui.color-slider-input");

  return <KobalteInput data-slot="color-slider-input" {...props} />;
}

/**
 * Пропсы `ColorSliderDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorSliderDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ColorSliderDescriptionProps<T>>;

/** Пояснение — ОДИН узел; уходит в `aria-describedby`. */
export function ColorSliderDescription<T extends ValidComponent = "div">(
  props: ColorSliderDescriptionComponentProps<T>,
) {
  traceLife("ui.color-slider-description");

  return (
    <KobalteDescription
      data-slot="color-slider-description"
      {...(props as ColorSliderDescriptionProps)}
    />
  );
}

/**
 * Пропсы `ColorSliderError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorSliderErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorSliderErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function ColorSliderError<T extends ValidComponent = "div">(
  props: ColorSliderErrorProps<T>,
) {
  traceLife("ui.color-slider-error");

  return (
    <KobalteErrorMessage data-slot="color-slider-error" {...(props as ColorSliderErrorMessageProps)} />
  );
}
