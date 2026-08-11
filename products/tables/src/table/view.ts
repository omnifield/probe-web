// Операции над состоянием вида и его чтение с границы.
//
// Состояние вида — ДАННЫЕ: порядок колонок, скрытые колонки, ключи сортировки. Рынок эту
// сущность не нормирует (`tasker:TABLES-5`), поэтому форма наша — и та же, что у фильтра:
// версия формата с первого дня и проверка чужого JSON с адресом ошибки.

import { isFieldRef } from "../filters/index.js";
import {
  type ColumnDictionary,
  type ColumnSpec,
  type FieldRef,
  type SortDirection,
  type SortRule,
  VIEW_FORMAT_VERSION,
  type ViewState,
} from "./model.js";

/**
 * Полный порядок колонок: сначала перечисленные в состоянии, затем остальные по словарю.
 *
 * Хвост важнее, чем кажется: колонка, добавленная в словарь после того, как вид сохранили,
 * обязана появиться, а не пропасть. Поэтому состояние вида задаёт порядок, а не состав.
 */
export function columnOrder(columns: ColumnDictionary, view: ViewState): FieldRef[] {
  const known = new Set(columns.map((column) => column.name));
  const named = view.order.filter((name) => known.has(name));
  const rest = columns.map((column) => column.name).filter((name) => !named.includes(name));
  return [...named, ...rest];
}

/** Колонки в порядке показа, без скрытых. */
export function visibleColumns(columns: ColumnDictionary, view: ViewState): ColumnSpec[] {
  const hidden = new Set(view.hidden);
  const byName = new Map(columns.map((column) => [column.name, column]));
  return columnOrder(columns, view)
    .filter((name) => !hidden.has(name))
    .map((name) => byName.get(name))
    .filter((column): column is ColumnSpec => column !== undefined);
}

/** Видима ли колонка. */
export function isVisible(view: ViewState, field: FieldRef): boolean {
  return !view.hidden.includes(field);
}

/** Показать/скрыть колонку. */
export function toggleColumn(view: ViewState, field: FieldRef): ViewState {
  return {
    ...view,
    hidden: view.hidden.includes(field)
      ? view.hidden.filter((name) => name !== field)
      : [...view.hidden, field],
  };
}

/**
 * Подвинуть колонку на шаг влево (`-1`) или вправо (`+1`).
 *
 * Шаг считается по ПОЛНОМУ порядку, включая скрытые: иначе перенос через скрытую колонку
 * менял бы её место молча, и вид «поехал» бы, как только её вернут.
 */
export function moveColumn(
  columns: ColumnDictionary,
  view: ViewState,
  field: FieldRef,
  step: -1 | 1,
): ViewState {
  const order = columnOrder(columns, view);
  const from = order.indexOf(field);
  if (from === -1) return view;

  const to = from + step;
  if (to < 0 || to >= order.length) return view;

  const next = [...order];
  next[from] = order[to]!;
  next[to] = field;

  return { ...view, order: next };
}

/** Направление сортировки по колонке; `null` — по ней не сортируют. */
export function sortDirectionOf(view: ViewState, field: FieldRef): SortDirection | null {
  return view.sorting.find((rule) => rule.field === field)?.direction ?? null;
}

/** Место ключа в сортировке, считая с единицы; `0` — не участвует. */
export function sortPositionOf(view: ViewState, field: FieldRef): number {
  return view.sorting.findIndex((rule) => rule.field === field) + 1;
}

/**
 * Переключить сортировку по колонке: нет → по возрастанию → по убыванию → нет.
 *
 * @param additive добавить ключ к имеющимся (множественная сортировка), а не заменить их
 */
export function toggleSort(view: ViewState, field: FieldRef, additive = false): ViewState {
  const current = sortDirectionOf(view, field);
  const others = additive ? view.sorting.filter((rule) => rule.field !== field) : [];

  if (current === null) return { ...view, sorting: [...others, { field, direction: "asc" }] };
  if (current === "asc") return { ...view, sorting: [...others, { field, direction: "desc" }] };
  return { ...view, sorting: others };
}

export type ParsedView = { ok: true; view: ViewState } | { ok: false; error: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function refList(value: unknown, what: string): FieldRef[] | string {
  if (!Array.isArray(value)) return `${what}: должно быть массивом`;
  for (const item of value) {
    if (typeof item !== "string" || !isFieldRef(item)) {
      return `${what}: «${String(item)}» — не путь вида «/имя» (JSON Pointer)`;
    }
  }
  return [...(value as string[])];
}

/** Прочитать вид из чужих данных: ошибка строкой с адресом, а не исключением. */
export function parseView(input: unknown): ParsedView {
  if (!isObject(input)) return { ok: false, error: "вид должен быть объектом" };

  const version = input["version"];
  if (version !== VIEW_FORMAT_VERSION) {
    return {
      ok: false,
      error:
        version === undefined
          ? "у вида нет версии формата — прочитать его нечем"
          : `версия формата ${String(version)} не поддерживается, нужна ${VIEW_FORMAT_VERSION}`,
    };
  }

  const order = refList(input["order"], "порядок колонок");
  if (typeof order === "string") return { ok: false, error: order };

  const hidden = refList(input["hidden"], "скрытые колонки");
  if (typeof hidden === "string") return { ok: false, error: hidden };

  const rawSorting = input["sorting"];
  if (!Array.isArray(rawSorting)) return { ok: false, error: "сортировка: должна быть массивом" };

  const sorting: SortRule[] = [];
  const seen = new Set<string>();

  for (const [index, rule] of rawSorting.entries()) {
    const where = `ключ сортировки №${index + 1}`;
    if (!isObject(rule)) return { ok: false, error: `${where}: должен быть объектом` };

    const field = rule["field"];
    const direction = rule["direction"];
    if (typeof field !== "string" || !isFieldRef(field)) {
      return { ok: false, error: `${where}: поле «${String(field)}» — не путь вида «/имя»` };
    }
    if (direction !== "asc" && direction !== "desc") {
      return { ok: false, error: `${where}: направление «${String(direction)}» неизвестно` };
    }
    // Один и тот же ключ дважды — противоречие, а не мелочь: какой из них главнее, сказать
    // нечем, и вид пришлось бы толковать наугад.
    if (seen.has(field)) return { ok: false, error: `${where}: поле «${field}» уже участвует` };

    seen.add(field);
    sorting.push({ field, direction });
  }

  return { ok: true, view: { version: VIEW_FORMAT_VERSION, order, hidden, sorting } };
}

/** Отдать вид наружу копией. */
export function serializeView(view: ViewState): ViewState {
  return JSON.parse(JSON.stringify(view)) as ViewState;
}
