import {
  AccordionItem as ArkItem,
  AccordionItemContent as ArkItemContent,
  AccordionItemIndicator as ArkItemIndicator,
  AccordionItemTrigger as ArkItemTrigger,
  type AccordionItemContentProps as ArkItemContentProps,
  type AccordionItemIndicatorProps as ArkItemIndicatorProps,
  type AccordionItemProps as ArkItemProps,
  type AccordionItemTriggerProps as ArkItemTriggerProps,
  AccordionRoot as ArkRoot,
  type AccordionRootProps as ArkRootProps,
} from "@ark-ui/solid/accordion";

import { traceLife } from "../trace.js";

// Раскрывающиеся разделы — ПЕРВЫЙ компонент кита, приехавший из Ark UI (`PWEB-37`).
//
// ## Что здесь изменилось по сравнению с прежней гармошкой
//
// Прежняя стояла на `@kobalte/core` и несла зацепки `data-slot`. Эта стоит на `@ark-ui/solid`,
// а адресуется АНАТОМИЕЙ — `data-scope="accordion"` плюс `data-part`, — и ставит их не наша
// обёртка, а сам Ark. То есть шов «кит ↔ скин» здесь закрыт по построению: адрес и селектор
// порождает одно объявление `@zag-js/anatomy`, и разъехаться им негде.
//
// Зацепок `data-slot` у гармошки поэтому НЕТ ни одной, и это решение, а не пропуск: заводить
// новому компоненту адреса снимаемой механики значило бы расширять то, от чего уходим. Прежние
// имена (`accordion`, `accordion-header`, `accordion-trigger`, …) сняты вместе с прежним
// компонентом — потребителей у них не было, проверено обходом дерева.
//
// ## Частей пять, и заголовка среди них нет
//
// `root · item · itemTrigger · itemContent · itemIndicator` — перечень приезжает готовым, своей
// анатомии мы не заводим. Заголовочной части у Ark нет, и это не пробел кита: паттерн WAI-ARIA
// просит обернуть кнопку раздела в заголовок нужного УРОВНЯ, а уровень зависит от места на
// странице и известен только потребителю. Обёртка — его узел:
//
//     <h3><AccordionItemTrigger>Доставка</AccordionItemTrigger></h3>
//
// ## Закрытый раздел остаётся в документе
//
// Прежняя гармошка закрытое содержимое УДАЛЯЛА. Эта его прячет: узел остаётся с `hidden` и
// `data-state="closed"`. Для оформления это разница по существу — несуществующий узел нельзя
// ни анимировать, ни измерить, — и она названа здесь, чтобы не открылась на первом переходе.
//
// Высоту Zag меряет сам и отдаёт кастом-свойствами `--height` / `--width` на узле содержимого;
// чем её выражать — переход, `grid-template-rows`, ничего — решает скин. Своей анимации кит не
// привозит, как и прежде.

/** Пропсы `Accordion` — корня набора разделов. */
export type AccordionProps = ArkRootProps;

/**
 * Корень набора — ОДИН узел плюс контекст.
 *
 * Держит открытые разделы (`value` / `defaultValue` / `onValueChange`), `multiple` (можно ли
 * держать открытыми несколько) и `collapsible` (можно ли закрыть последний открытый).
 *
 * @example
 * ```tsx
 * <Accordion multiple defaultValue={["доставка"]}>
 *   <AccordionItem value="доставка">
 *     <h3>
 *       <AccordionItemTrigger>
 *         Доставка
 *         <AccordionItemIndicator>▾</AccordionItemIndicator>
 *       </AccordionItemTrigger>
 *     </h3>
 *     <AccordionItemContent>Курьером и самовывозом</AccordionItemContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion(props: AccordionProps) {
  traceLife("ui.accordion");

  return <ArkRoot {...props} />;
}

/** Пропсы `AccordionItem`. */
export type AccordionItemProps = ArkItemProps;

/**
 * Один раздел — ОДИН узел плюс контекст своих частей. Обязателен проп `value`.
 *
 * Раздел и есть то место, ради которого гармошка взята первой составной: узлов у него
 * несколько, координата скина одна, и покрашенный раз он одевается во всех разделах сразу.
 */
export function AccordionItem(props: AccordionItemProps) {
  traceLife("ui.accordion-item");

  return <ArkItem {...props} />;
}

/** Пропсы `AccordionItemTrigger`. */
export type AccordionItemTriggerProps = ArkItemTriggerProps;

/**
 * Кнопка раскрытия — ОДИН узел `<button>`.
 *
 * Состояние приезжает `data-state="open" | "closed"`, отключённость — нативным `disabled`
 * (Zag ставит его на кнопку, а не `data-disabled`), фокус — `data-focus`.
 */
export function AccordionItemTrigger(props: AccordionItemTriggerProps) {
  traceLife("ui.accordion-item-trigger");

  return <ArkItemTrigger {...props} />;
}

/** Пропсы `AccordionItemContent`. */
export type AccordionItemContentProps = ArkItemContentProps;

/** Содержимое раздела — ОДИН узел; закрытый прячется `hidden`, а не удаляется. */
export function AccordionItemContent(props: AccordionItemContentProps) {
  traceLife("ui.accordion-item-content");

  return <ArkItemContent {...props} />;
}

/** Пропсы `AccordionItemIndicator`. */
export type AccordionItemIndicatorProps = ArkItemIndicatorProps;

/**
 * Указатель раскрытия — ОДИН узел, спрятанный от скринридера (`aria-hidden`).
 *
 * Стрелку кладёт внутрь потребитель: своей графики кит не привозит. Поворот — дело скина, ему
 * для этого и объявлено состояние раскрытия на самом указателе.
 */
export function AccordionItemIndicator(props: AccordionItemIndicatorProps) {
  traceLife("ui.accordion-item-indicator");

  return <ArkItemIndicator {...props} />;
}
