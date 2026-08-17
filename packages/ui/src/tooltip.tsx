import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Arrow as KobalteArrow,
  Content as KobalteContent,
  Portal as KobaltePortal,
  Root as KobalteTooltip,
  type TooltipArrowProps,
  type TooltipContentProps,
  type TooltipPortalProps,
  type TooltipRootProps,
  type TooltipTriggerProps,
  Trigger as KobalteTrigger,
} from "@kobalte/core/tooltip";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

// Подсказка: короткий текст у элемента, появляющийся по наведению и по фокусу.
//
// ## Чем это НЕ является — и почему разница не косметическая
//
// Подсказка не заменяет `Popover`: у неё нет фокуса внутри, её нельзя открыть с клавиатуры
// как панель, и содержимое, до которого нужно дотянуться указателем (ссылка, кнопка),
// класть в неё нельзя — оно окажется недостижимым. Интерактивное содержимое — это `Popover`.
//
// Своего узла у корня и портала нет — как и у `Popover`, зацепок у них поэтому тоже нет.
//
// ## Задержки и опции позиционировщика стоят на КОРНЕ
//
// `openDelay`, `closeDelay`, `skipDelayDuration`, а также `placement`, `gutter`, `shift`,
// `flip` — всё на `Tooltip`. Панель принимает готовый результат.

/** Пропсы `Tooltip` — корня: открытость, задержки и опции позиционировщика. */
export type TooltipProps = TooltipRootProps;

/**
 * Корень подсказки — узла НЕ рендерит, заводит контекст и поток позиционирования.
 *
 * @example
 * ```tsx
 * <Tooltip openDelay={300} placement="top">
 *   <TooltipTrigger as={Button}>Сохранить</TooltipTrigger>
 *   <TooltipPortal>
 *     <TooltipContent>
 *       <TooltipArrow />
 *       Ctrl+S
 *     </TooltipContent>
 *   </TooltipPortal>
 * </Tooltip>
 * ```
 */
export function Tooltip(props: TooltipProps) {
  traceLife("ui.tooltip");

  return <KobalteTooltip {...props} />;
}

/**
 * Пропсы `TooltipTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type TooltipTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  TooltipTriggerProps<T>
>;

/**
 * Элемент, к которому привязана подсказка, — ОДИН узел, по умолчанию `<button>`.
 *
 * Чаще всего это уже существующая кнопка: `<TooltipTrigger as={Button}>` не добавляет узла, а
 * надевает поведение на неё. Обёртка вокруг чужого элемента здесь была бы лишним узлом в
 * разметке и лишней целью для оформления.
 */
export const TooltipTrigger = slotAware(function TooltipTrigger<T extends ValidComponent = "button">(
  props: TooltipTriggerComponentProps<T>,
) {
  traceLife("ui.tooltip-trigger");

  const [slot, rest] = useSlot(props, "tooltip-trigger");

  return <KobalteTrigger {...slot} {...(rest as TooltipTriggerProps)} />;
});

/** Портал подсказки — узла НЕ рендерит, переносит содержимое в конец документа. */
export function TooltipPortal(props: TooltipPortalProps) {
  traceLife("ui.tooltip-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `TooltipContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TooltipContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TooltipContentProps<T>
>;

/**
 * Сама подсказка — то же отступление от 1-to-1, что у `SelectContent` и `PopoverContent`:
 * позиционер плюс панель внутри него. Обоснование там же, оно общее для всего всплывающего.
 */
export function TooltipContent<T extends ValidComponent = "div">(
  props: TooltipContentComponentProps<T>,
) {
  traceLife("ui.tooltip-content");

  return <KobalteContent data-slot="tooltip-content" {...(props as TooltipContentProps)} />;
}

/**
 * Пропсы `TooltipArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TooltipArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TooltipArrowProps<T>
>;

/**
 * Стрелка-указатель — та же механика, что у `PopoverArrow`, и те же два отступления:
 * внутри `<svg>` (иначе стрелку не повернуть вслед за положением панели) и инлайновый стиль,
 * в котором `fill` и `stroke` СЧИТАНЫ с самой подсказки. Разбор — в `src/popover.tsx`.
 */
export function TooltipArrow<T extends ValidComponent = "div">(
  props: TooltipArrowComponentProps<T>,
) {
  traceLife("ui.tooltip-arrow");

  return <KobalteArrow data-slot="tooltip-arrow" {...(props as TooltipArrowProps)} />;
}
