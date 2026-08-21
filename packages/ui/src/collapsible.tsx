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

// Одиночная раскрывашка. Стояла в одном файле с гармошкой, пока обе приезжали из `@kobalte/core`
// и повторяли друг друга частями; гармошка уехала на Ark (`PWEB-37`), и совмещение потеряло
// основание — у Ark это ДВА компонента с двумя анатомиями, и собственный паспорт раскрывашке
// придётся объявлять свой.
//
// Здесь она осталась КАК БЫЛА, на kobalte и с прежними зацепками: её переезд — отдельная
// задача, а сделать его заодно значило бы снять обещание по `data-slot` у компонента, которого
// задача не касалась.
//
// Высоту считает kobalte и отдаёт `--kb-collapsible-content-height`: чем её выражать — переход,
// `grid-template-rows`, ничего — решает оформление. Своей анимации кит не привозит.

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
 * Отдельный примитив, а не гармошка из одного раздела: у неё нет ни заголовка-обёртки, ни
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
