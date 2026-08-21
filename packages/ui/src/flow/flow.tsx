import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../slot-chain.js";
import { traceLife } from "../trace.js";
import { parts } from "./flow.anatomy.js";

// Поток — элементы друг за другом по одной оси.
//
// ## Ни направления, ни зазора, ни выравнивания в разметке
//
// Всё это ВИД, и задаёт его скин по адресу (`data-scope="flow"`). Проп `gap` или `direction`
// означал бы, что кит знает, как выглядит раскладка, — а он безголовый и знать этого не может.
// Практическое следствие: приложение, где зазор проставлен пропами, скином не переодеть, и
// смена скина раскладку не поменяет. Ровно от этого мы и уходим.
//
// Голый поток поэтому НИЧЕГО не расставляет — это законное рабочее состояние кита без скина.
//
// ## Обёртка элемента — только там, где размещают
//
// `FlowItem` нужен, когда у одного элемента своё поведение в потоке («поле тянется, кнопка по
// содержимому»): свойства размещения живут на ребёнке, а дети потока — чужие компоненты, и
// правило по ним попало бы на все сразу. Остальные элементы кладут в поток напрямую.

/**
 * Пропсы `Flow`: всё, что принимает целевой элемент, плюс `as`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type FlowProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Поток — ОДИН узел с адресом и ничем больше.
 *
 * @example
 * ```tsx
 * <Flow data-variant="панель-действий">
 *   <Button>Отмена</Button>
 *   <Button data-variant="главная">Сохранить</Button>
 * </Flow>
 *
 * <Flow data-variant="поиск">
 *   <FlowItem data-variant="тянется">
 *     <Input />
 *   </FlowItem>
 *   <Button>Найти</Button>
 * </Flow>
 * ```
 */
export const Flow = slotAware(function Flow<T extends ValidComponent = "div">(
  props: FlowProps<T>,
) {
  traceLife("ui.flow");

  const address = useAddress(props, parts.root.attrs);

  return <Polymorphic as="div" {...address} {...props} />;
});

/**
 * Пропсы `FlowItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type FlowItemProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Место одного элемента в потоке — ОДИН узел с адресом. */
export const FlowItem = slotAware(function FlowItem<T extends ValidComponent = "div">(
  props: FlowItemProps<T>,
) {
  traceLife("ui.flow-item");

  const address = useAddress(props, parts.item.attrs);

  return <Polymorphic as="div" {...address} {...props} />;
});
