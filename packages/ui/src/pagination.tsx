import {
  Ellipsis as KobalteEllipsis,
  Item as KobalteItem,
  Items as KobalteItems,
  Next as KobalteNext,
  type PaginationEllipsisProps,
  type PaginationItemProps,
  type PaginationItemsProps,
  type PaginationNextProps,
  type PaginationPreviousProps,
  type PaginationRootProps,
  Previous as KobaltePrevious,
  Root as KobaltePagination,
} from "@kobalte/core/pagination";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Постраничная навигация: страницы таблицы, длинная выборка.
//
// ## Какие номера показать — считает kobalte, а не потребитель
//
// `count`, `siblingCount` и `showFirst` / `showLast` описывают ПРАВИЛО, а не список: сколько
// соседей у текущей страницы, показывать ли крайние. Из правила kobalte и раскладывает
// «1 … 4 5 6 … 20» — вместе с многоточиями, которые тоже узлы.
//
// Сам список номеров рисует `PaginationItems` — часть без своего узла: она разворачивается в
// номера и многоточия по правилу корня. Своей зацепки у неё поэтому нет, а у номера и
// многоточия — есть.

/**
 * Пропсы `Pagination` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `nav`.
 */
export type PaginationProps<T extends ValidComponent = "nav"> = PolymorphicProps<
  T,
  PaginationRootProps<T>
>;

/**
 * Корень — ОДИН узел `<nav>` плюс контекст.
 *
 * Держит текущую страницу (`page` / `defaultPage` / `onPageChange`), общее число (`count`) и
 * правило раскладки. Разметку задаёт потребитель: `itemComponent` и `ellipsisComponent` —
 * это то, ЧЕМ рисовать номер и многоточие.
 *
 * @example
 * ```tsx
 * <Pagination
 *   count={20}
 *   page={page()}
 *   onPageChange={setPage}
 *   itemComponent={(props) => <PaginationItem page={props.page}>{props.page}</PaginationItem>}
 *   ellipsisComponent={() => <PaginationEllipsis>…</PaginationEllipsis>}
 * >
 *   <PaginationPrevious>Назад</PaginationPrevious>
 *   <PaginationItems />
 *   <PaginationNext>Вперёд</PaginationNext>
 * </Pagination>
 * ```
 */
export function Pagination<T extends ValidComponent = "nav">(props: PaginationProps<T>) {
  traceLife("ui.pagination");

  return <KobaltePagination data-slot="pagination" {...(props as PaginationRootProps)} />;
}

/** Список номеров — своего узла НЕ рендерит, разворачивается в номера и многоточия. */
export function PaginationItems(props: PaginationItemsProps) {
  traceLife("ui.pagination-items");

  return <KobalteItems {...props} />;
}

/**
 * Пропсы `PaginationItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type PaginationItemComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  PaginationItemProps<T>
>;

/**
 * Номер страницы — ОДИН узел `<button>`. Обязателен проп `page`.
 *
 * Текущая страница помечена `data-current` и `aria-current="page"` — оформлению не нужно
 * сравнивать числа самому.
 */
export function PaginationItem<T extends ValidComponent = "button">(
  props: PaginationItemComponentProps<T>,
) {
  traceLife("ui.pagination-item");

  return <KobalteItem data-slot="pagination-item" {...(props as PaginationItemProps)} />;
}

/**
 * Пропсы `PaginationEllipsis`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type PaginationEllipsisComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  PaginationEllipsisProps<T>
>;

/** Многоточие между номерами — ОДИН узел; знак кладёт потребитель. */
export function PaginationEllipsis<T extends ValidComponent = "div">(
  props: PaginationEllipsisComponentProps<T>,
) {
  traceLife("ui.pagination-ellipsis");

  return (
    <KobalteEllipsis data-slot="pagination-ellipsis" {...(props as PaginationEllipsisProps)} />
  );
}

/**
 * Пропсы `PaginationPrevious`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type PaginationPreviousComponentProps<T extends ValidComponent = "button"> =
  PolymorphicProps<T, PaginationPreviousProps<T>>;

/** Кнопка «назад» — ОДИН узел; на первой странице kobalte её отключает сам. */
export function PaginationPrevious<T extends ValidComponent = "button">(
  props: PaginationPreviousComponentProps<T>,
) {
  traceLife("ui.pagination-previous");

  return (
    <KobaltePrevious data-slot="pagination-previous" {...(props as PaginationPreviousProps)} />
  );
}

/**
 * Пропсы `PaginationNext`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type PaginationNextComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  PaginationNextProps<T>
>;

/** Кнопка «вперёд» — ОДИН узел; на последней странице отключается. */
export function PaginationNext<T extends ValidComponent = "button">(
  props: PaginationNextComponentProps<T>,
) {
  traceLife("ui.pagination-next");

  return <KobalteNext data-slot="pagination-next" {...(props as PaginationNextProps)} />;
}
