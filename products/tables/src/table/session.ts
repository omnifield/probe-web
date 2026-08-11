// Состояние СЕАНСА: страница, раскрытые группы, выделенные и закреплённые строки.
//
// Отдельно от вида и без версии — намеренно (`model.ts`): это «где я сейчас», а не «как я
// смотрю». Всё здесь привязано к идентификаторам конкретных строк, а строки живут меньше,
// чем сохранённый вид.

import type { SessionState } from "./model.js";

/** Раскрыта ли группа. */
export function isExpanded(session: SessionState, rowId: string): boolean {
  return session.expanded === "all" || session.expanded.includes(rowId);
}

/**
 * Раскрыть/свернуть группу.
 *
 * Когда раскрыто «всё», первое сворачивание разворачивает это в перечень — иначе пришлось бы
 * хранить «всё, кроме» и толковать два разных смысла одного поля.
 */
export function toggleExpanded(session: SessionState, rowId: string, known: string[]): SessionState {
  if (session.expanded === "all") {
    return { ...session, expanded: known.filter((id) => id !== rowId) };
  }
  return {
    ...session,
    expanded: session.expanded.includes(rowId)
      ? session.expanded.filter((id) => id !== rowId)
      : [...session.expanded, rowId],
  };
}

/** Раскрыть или свернуть все группы разом. */
export function expandAll(session: SessionState, open: boolean): SessionState {
  return { ...session, expanded: open ? "all" : [] };
}

/** Выделена ли строка. */
export function isSelected(session: SessionState, rowId: string): boolean {
  return session.selected.includes(rowId);
}

/** Выделить/снять выделение строки. */
export function toggleSelected(session: SessionState, rowId: string): SessionState {
  return {
    ...session,
    selected: session.selected.includes(rowId)
      ? session.selected.filter((id) => id !== rowId)
      : [...session.selected, rowId],
  };
}

/** Выделить перечисленные строки или снять выделение со всех. */
export function setSelected(session: SessionState, ids: readonly string[]): SessionState {
  return { ...session, selected: [...ids] };
}

/** К какому краю прижата строка; `null` — ни к какому. */
export function pinnedRowEdge(session: SessionState, rowId: string): "top" | "bottom" | null {
  if (session.pinnedRows.top.includes(rowId)) return "top";
  if (session.pinnedRows.bottom.includes(rowId)) return "bottom";
  return null;
}

/** Прижать строку к верху или низу; `null` — отпустить. */
export function pinRow(
  session: SessionState,
  rowId: string,
  edge: "top" | "bottom" | null,
): SessionState {
  const top = session.pinnedRows.top.filter((id) => id !== rowId);
  const bottom = session.pinnedRows.bottom.filter((id) => id !== rowId);

  return {
    ...session,
    pinnedRows:
      edge === "top"
        ? { top: [...top, rowId], bottom }
        : edge === "bottom"
          ? { top, bottom: [...bottom, rowId] }
          : { top, bottom },
  };
}

/** Сколько страниц выйдет. Ноль строк — всё равно одна страница: пустую тоже показывают. */
export function pageCount(total: number, pageSize: number | null): number {
  if (pageSize === null || pageSize < 1) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Перейти на страницу, не выходя за края. */
export function goToPage(
  session: SessionState,
  page: number,
  total: number,
  pageSize: number | null,
): SessionState {
  const last = pageCount(total, pageSize) - 1;
  return { ...session, page: Math.max(0, Math.min(page, last)) };
}

/**
 * Подтянуть страницу в границы после того, как набор изменился.
 *
 * Отбор сократил список — страница №7 перестала существовать, и показывать пустоту вместо
 * последней страницы значит соврать, что данных нет.
 */
export function clampPage(session: SessionState, total: number, pageSize: number | null): SessionState {
  const last = pageCount(total, pageSize) - 1;
  return session.page > last ? { ...session, page: last } : session;
}
