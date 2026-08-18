import {
  Background as KobalteBackground,
  type ColorAreaBackgroundProps,
  type ColorAreaDescriptionProps,
  type ColorAreaErrorMessageProps,
  type ColorAreaHiddenInputXProps,
  type ColorAreaHiddenInputYProps,
  type ColorAreaLabelProps,
  type ColorAreaRootProps,
  type ColorAreaThumbProps,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  HiddenInputX as KobalteHiddenInputX,
  HiddenInputY as KobalteHiddenInputY,
  Label as KobalteLabel,
  Root as KobalteColorArea,
  Thumb as KobalteThumb,
} from "@kobalte/core/color-area";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Выбор цвета ДВУМЯ каналами сразу: квадрат насыщенности и яркости, по которому тянут.
//
// ## Почему это не два ползунка рядом
//
// Два канала здесь меняются ОДНИМ жестом, и это не удобство, а суть: подобрать оттенок,
// двигая насыщенность и яркость по очереди, нельзя — глаз оценивает их вместе. Отсюда и
// клавиатура двумерная: стрелки ходят по обеим осям, `PageUp`/`PageDown` — крупным шагом.
//
// ## Значение — объект `Color`, а не строка
//
// `value` / `defaultValue` / `onChange` работают с `Color` из `@kobalte/core/colors` (собрать
// его — `parseColor("#2f6fed")`, обратно в строку — `color.toString("hex")`). Мы этот тип НЕ
// переоборачиваем: своя обёртка над цветовой моделью означала бы второй источник правды о том,
// что такое цвет, а модель приезжает от `@kobalte/core` и никуда больше.
//
// Каналы осей выбираются пропсами `xChannel` / `yChannel` в пространстве `colorSpace`; без них
// `@kobalte/core` берёт пару из текущего пространства значения сам.
//
// ## Названное отступление: цвет приезжает инлайновым стилем
//
// На подложке — градиенты, на бегунке — координаты и переменная `--kb-color-current`. Это
// НЕ вид, а само значение примитива: подложка обязана показывать те цвета, между которыми
// выбирают, и знает их только он. Разбор — в доке `ColorAreaBackground` и в пробе
// (`test/color-area.test.tsx`), а не одним абзацем в README.

/**
 * Пропсы `ColorArea` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorAreaProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorAreaRootProps<T>
>;

/**
 * Корень области — ОДИН узел `[role=group]` плюс контекст для частей.
 *
 * Держит значение (`value` / `defaultValue` / `onChange` / `onChangeEnd`), каналы осей
 * (`xChannel`, `yChannel`, `colorSpace`), имена для формы (`name`, `xName`, `yName`) и
 * состояние (`validationState`, `required`, `disabled`, `readOnly`).
 *
 * @example
 * ```tsx
 * <ColorArea value={color()} onChange={setColor} xChannel="saturation" yChannel="brightness">
 *   <ColorAreaLabel>Оттенок</ColorAreaLabel>
 *   <ColorAreaBackground>
 *     <ColorAreaThumb>
 *       <ColorAreaHiddenInputX />
 *       <ColorAreaHiddenInputY />
 *     </ColorAreaThumb>
 *   </ColorAreaBackground>
 * </ColorArea>
 * ```
 */
export function ColorArea<T extends ValidComponent = "div">(props: ColorAreaProps<T>) {
  traceLife("ui.color-area");

  return <KobalteColorArea data-slot="color-area" {...(props as ColorAreaRootProps)} />;
}

/**
 * Пропсы `ColorAreaLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type ColorAreaLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  ColorAreaLabelProps<T>
>;

/** Подпись области — ОДИН узел; уходит в `aria-labelledby` группы. */
export function ColorAreaLabel<T extends ValidComponent = "label">(
  props: ColorAreaLabelComponentProps<T>,
) {
  traceLife("ui.color-area-label");

  return <KobalteLabel data-slot="color-area-label" {...(props as ColorAreaLabelProps)} />;
}

/**
 * Пропсы `ColorAreaBackground`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorAreaBackgroundComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorAreaBackgroundProps<T>
>;

/**
 * Подложка — ОДИН узел; она же поле для жеста и она же показ выбора.
 *
 * **Названное отступление от «ноль стилей».** `@kobalte/core` пишет сюда инлайновый
 * `background` из двух-трёх градиентов, `background-blend-mode` и `touch-action: none`.
 * Отдать это оформлению нельзя по существу: градиенты считаются ИЗ значения (какие именно
 * цвета стоят по краям осей, знает только примитив), а без `touch-action` жест на телефоне
 * прокручивал бы страницу вместо выбора цвета.
 *
 * Стиль потребителя при этом не затирается, а СЛИВАЕТСЯ с нашим: размер, скругление и рамка
 * пишутся как обычно и остаются работой оформления. Держится это пробой, а не обещанием.
 *
 * Бегунок ставится ВНУТРЬ подложки: его координаты считаются в процентах от её размеров.
 */
export function ColorAreaBackground<T extends ValidComponent = "div">(
  props: ColorAreaBackgroundComponentProps<T>,
) {
  traceLife("ui.color-area-background");

  return (
    <KobalteBackground data-slot="color-area-background" {...(props as ColorAreaBackgroundProps)} />
  );
}

/**
 * Пропсы `ColorAreaThumb`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ColorAreaThumbComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ColorAreaThumbProps<T>
>;

/**
 * Бегунок — ОДИН узел; его положение по обеим осям считает `@kobalte/core`.
 *
 * Инлайновым стилем приезжают `position`, `left`/`top` в процентах, `transform` центровки,
 * `touch-action: none` и переменная `--kb-color-current` с выбранным цветом. Первые четыре —
 * механика положения и жеста, последняя — данные: **по ней оформление красит сам бегунок**, не
 * зная про цветовые модели (`background: var(--kb-color-current)`).
 *
 * Вид у бегунка не задан вовсе: без правил оформления это невидимая точка. Скрытые вводы
 * формы ставятся ВНУТРЬ него — они несут фокус и клавиатуру.
 */
export function ColorAreaThumb<T extends ValidComponent = "span">(
  props: ColorAreaThumbComponentProps<T>,
) {
  traceLife("ui.color-area-thumb");

  return <KobalteThumb data-slot="color-area-thumb" {...(props as ColorAreaThumbProps)} />;
}

/**
 * Скрытый ввод оси X — ОДИН узел `<input type="range">`.
 *
 * Вводов два, потому что каналов два, и каждый уезжает в форму своим именем (`xName` / `yName`
 * на корне). Спрятаны той же механикой, что и вводы флажка: `visuallyHiddenStyles` от
 * `@kobalte/core` — настоящий ввод обязан остаться в документе ради фокуса, клавиатуры и
 * скринридера, но не должен быть виден.
 */
export function ColorAreaHiddenInputX(props: ColorAreaHiddenInputXProps) {
  traceLife("ui.color-area-hidden-input-x");

  return <KobalteHiddenInputX data-slot="color-area-hidden-input-x" {...props} />;
}

/** Скрытый ввод оси Y — ОДИН узел `<input type="range">`; всё как у оси X. */
export function ColorAreaHiddenInputY(props: ColorAreaHiddenInputYProps) {
  traceLife("ui.color-area-hidden-input-y");

  return <KobalteHiddenInputY data-slot="color-area-hidden-input-y" {...props} />;
}

/**
 * Пропсы `ColorAreaDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorAreaDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorAreaDescriptionProps<T>
>;

/** Пояснение — ОДИН узел; уходит в `aria-describedby`. */
export function ColorAreaDescription<T extends ValidComponent = "div">(
  props: ColorAreaDescriptionComponentProps<T>,
) {
  traceLife("ui.color-area-description");

  return (
    <KobalteDescription
      data-slot="color-area-description"
      {...(props as ColorAreaDescriptionProps)}
    />
  );
}

/**
 * Пропсы `ColorAreaError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ColorAreaErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ColorAreaErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function ColorAreaError<T extends ValidComponent = "div">(props: ColorAreaErrorProps<T>) {
  traceLife("ui.color-area-error");

  return (
    <KobalteErrorMessage data-slot="color-area-error" {...(props as ColorAreaErrorMessageProps)} />
  );
}
