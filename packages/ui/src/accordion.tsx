import {
  type AccordionContentProps,
  type AccordionHeaderProps,
  type AccordionItemProps,
  type AccordionRootProps,
  type AccordionTriggerProps,
  Content as KobalteContent,
  Header as KobalteHeader,
  Item as KobalteItem,
  Root as KobalteAccordion,
  Trigger as KobalteTrigger,
} from "@kobalte/core/accordion";
import {
  type CollapsibleContentProps,
  type CollapsibleRootProps,
  type CollapsibleTriggerProps,
  Content as KobalteCollapsibleContent,
  Root as KobalteCollapsible,
  Trigger as KobalteCollapsibleTrigger,
} from "@kobalte/core/collapsible";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

// Раскрывающиеся разделы — и одиночный, и набор. Два семейства в одном файле, потому что
// второе это первое, повторённое списком: у `Accordion` внутри те же части, плюс своя
// навигация стрелками и правило «сколько разделов открыто разом».
//
// ## Заголовок отдельной частью — не украшение
//
// `AccordionHeader` рендерит `<h3>` и оборачивает кнопку. Без него раскрывашка выпадает из
// оглавления страницы: скринридер строит его по заголовкам, а не по кнопкам. Уровень меняется
// через `as` — в глубине страницы `<h3>` может быть неверным, и это решение потребителя.
//
// ## Высоту анимирует ПОТРЕБИТЕЛЬ, а не кит
//
// kobalte отдаёт `--kb-accordion-content-height` и `--kb-collapsible-content-height`: сама
// высота посчитана, а чем её выражать (переход, `grid-template-rows`, ничего) — вид, и решает
// его оформление. Своей анимации кит не привозит.

/**
 * Пропсы `Accordion` — корня набора разделов.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type AccordionProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  AccordionRootProps<T>
>;

/**
 * Корень набора — ОДИН узел плюс контекст.
 *
 * Держит открытые разделы (`value` / `defaultValue` / `onChange`), `multiple` (можно ли
 * держать открытыми несколько) и `collapsible` (можно ли закрыть последний открытый).
 *
 * @example
 * ```tsx
 * <Accordion multiple defaultValue={["доставка"]}>
 *   <AccordionItem value="доставка">
 *     <AccordionHeader>
 *       <AccordionTrigger>Доставка</AccordionTrigger>
 *     </AccordionHeader>
 *     <AccordionContent>Курьером и самовывозом</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion<T extends ValidComponent = "div">(props: AccordionProps<T>) {
  traceLife("ui.accordion");

  return <KobalteAccordion data-slot="accordion" {...(props as AccordionRootProps)} />;
}

/**
 * Пропсы `AccordionItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type AccordionItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  AccordionItemProps<T>
>;

/** Один раздел — ОДИН узел плюс контекст своих частей. Обязателен проп `value`. */
export function AccordionItem<T extends ValidComponent = "div">(
  props: AccordionItemComponentProps<T>,
) {
  traceLife("ui.accordion-item");

  return <KobalteItem data-slot="accordion-item" {...(props as AccordionItemProps)} />;
}

/**
 * Пропсы `AccordionHeader`.
 *
 * @typeParam T — что рендерить. По умолчанию `h3`.
 */
export type AccordionHeaderComponentProps<T extends ValidComponent = "h3"> = PolymorphicProps<
  T,
  AccordionHeaderProps<T>
>;

/** Заголовок раздела — ОДИН узел `<h3>`, внутри которого стоит кнопка. */
export function AccordionHeader<T extends ValidComponent = "h3">(
  props: AccordionHeaderComponentProps<T>,
) {
  traceLife("ui.accordion-header");

  return <KobalteHeader data-slot="accordion-header" {...(props as AccordionHeaderProps)} />;
}

/**
 * Пропсы `AccordionTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type AccordionTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  AccordionTriggerProps<T>
>;

/** Кнопка раскрытия — ОДИН узел `<button>`; состояние приезжает `data-expanded`. */
export function AccordionTrigger<T extends ValidComponent = "button">(
  props: AccordionTriggerComponentProps<T>,
) {
  traceLife("ui.accordion-trigger");

  return <KobalteTrigger data-slot="accordion-trigger" {...(props as AccordionTriggerProps)} />;
}

/**
 * Пропсы `AccordionContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type AccordionContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  AccordionContentProps<T>
>;

/**
 * Содержимое раздела — ОДИН узел.
 *
 * Закрытый раздел из документа УДАЛЯЕТСЯ. Нужен переход при закрытии — `forceMount` и своё
 * условие снаружи: то же правило, что у панелей вкладок.
 */
export function AccordionContent<T extends ValidComponent = "div">(
  props: AccordionContentComponentProps<T>,
) {
  traceLife("ui.accordion-content");

  return <KobalteContent data-slot="accordion-content" {...(props as AccordionContentProps)} />;
}

/**
 * Пропсы `Collapsible` — одиночной раскрывашки.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CollapsibleProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CollapsibleRootProps<T>
>;

/**
 * Одиночная раскрывашка — ОДИН узел плюс контекст.
 *
 * Отдельный примитив, а не `Accordion` из одного раздела: у неё нет ни заголовка-обёртки, ни
 * навигации стрелками между разделами — их там просто нет. «Показать ещё», боковая панель,
 * подробности строки.
 *
 * @example
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Подробнее</CollapsibleTrigger>
 *   <CollapsibleContent>…</CollapsibleContent>
 * </Collapsible>
 * ```
 */
export function Collapsible<T extends ValidComponent = "div">(props: CollapsibleProps<T>) {
  traceLife("ui.collapsible");

  return <KobalteCollapsible data-slot="collapsible" {...(props as CollapsibleRootProps)} />;
}

/**
 * Пропсы `CollapsibleTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type CollapsibleTriggerComponentProps<T extends ValidComponent = "button"> =
  PolymorphicProps<T, CollapsibleTriggerProps<T>>;

/** Кнопка раскрытия — ОДИН узел; состояние приезжает `data-expanded`. */
export const CollapsibleTrigger = slotAware(function CollapsibleTrigger<T extends ValidComponent = "button">(
  props: CollapsibleTriggerComponentProps<T>,
) {
  traceLife("ui.collapsible-trigger");

  const [slot, rest] = useSlot(props, "collapsible-trigger");

  return (
    <KobalteCollapsibleTrigger {...slot} {...(rest as CollapsibleTriggerProps)} />
  );
});

/**
 * Пропсы `CollapsibleContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type CollapsibleContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  CollapsibleContentProps<T>
>;

/** Содержимое — ОДИН узел; в закрытом состоянии удаляется, если не задан `forceMount`. */
export function CollapsibleContent<T extends ValidComponent = "div">(
  props: CollapsibleContentComponentProps<T>,
) {
  traceLife("ui.collapsible-content");

  return (
    <KobalteCollapsibleContent
      data-slot="collapsible-content"
      {...(props as CollapsibleContentProps)}
    />
  );
}
