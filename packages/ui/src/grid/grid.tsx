import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../slot-chain.js";
import { traceLife } from "../trace.js";
import { parts } from "./grid.anatomy.js";

// Сетка — общие дорожки, по которым элементы выравниваются и поперёк строк.
//
// ## Что нельзя собрать потоком
//
// Ровно одно, и оно же причина заводить второй компонент раскладки: ВЫРАВНИВАНИЕ МЕЖДУ
// СТРОКАМИ. Поток переносит элементы, но каждая строка живёт сама по себе — колонки формы,
// собранной потоками, разъезжаются, как только подпись в одной строке длиннее, чем в соседней.
// Сетка держит дорожки общими; это её предмет, и никакой вариацией потока он не выражается.
//
// ## Число колонок — вид, и его здесь нет
//
// Ни пропа, ни значения по умолчанию: сколько дорожек и какой ширины — правило скина по адресу
// `data-scope="grid"`. Проп `columns` означал бы, что кит знает, как выглядит раскладка.
//
// Честный предел: число колонок, вычисленное из ДАННЫХ (столько, сколько полей приехало), так
// не выражается — это предмет компонента, который эти данные знает, а не общей сетки.

/**
 * Пропсы `Grid`: всё, что принимает целевой элемент, плюс `as`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type GridProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Сетка — ОДИН узел с адресом и ничем больше.
 *
 * @example
 * ```tsx
 * <Grid data-variant="форма-две-колонки">
 *   <Field>…</Field>
 *   <Field>…</Field>
 *   <GridCell data-variant="во-всю-ширину">
 *     <Field>…</Field>
 *   </GridCell>
 * </Grid>
 * ```
 */
export const Grid = slotAware(function Grid<T extends ValidComponent = "div">(
  props: GridProps<T>,
) {
  traceLife("ui.grid");

  const address = useAddress(props, parts.root.attrs);

  return <Polymorphic as="div" {...address} {...props} />;
});

/**
 * Пропсы `GridCell`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type GridCellProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Место одного элемента в сетке — ОДИН узел с адресом. */
export const GridCell = slotAware(function GridCell<T extends ValidComponent = "div">(
  props: GridCellProps<T>,
) {
  traceLife("ui.grid-cell");

  const address = useAddress(props, parts.cell.attrs);

  return <Polymorphic as="div" {...address} {...props} />;
});
