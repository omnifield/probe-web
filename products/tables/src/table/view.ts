// Операции над состоянием вида и его чтение с границы.
//
// Состояние вида — ДАННЫЕ: порядок колонок, скрытые, закреплённые, ширины, группировка, ключи
// сортировки и размер страницы. Рынок эту сущность не нормирует (`TABLES-5`), поэтому
// форма наша — и та же, что у фильтра: версия формата с первого дня и проверка чужого JSON с
// адресом ошибки.
//
// Версия здесь не украшение: вторая волна изменила форму, и виды версии 1 поднимаются до 2
// разбором, а не выбрасываются молча. Ровно ради этого поле и заводилось.

import { isFieldRef } from "../filters/index.js";
import {
  type ColumnDictionary,
  type ColumnSpec,
  type FieldRef,
  groupableBy,
  type PinnedEdges,
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

/** Колонки в порядке показа, без скрытых. Закреплённые идут своими краями. */
export function visibleColumns(columns: ColumnDictionary, view: ViewState): ColumnSpec[] {
  const hidden = new Set(view.hidden);
  const byName = new Map(columns.map((column) => [column.name, column]));
  const order = columnOrder(columns, view).filter((name) => !hidden.has(name));

  const start = view.pinned.start.filter((name) => order.includes(name));
  const end = view.pinned.end.filter((name) => order.includes(name));
  const middle = order.filter((name) => !start.includes(name) && !end.includes(name));

  return [...start, ...middle, ...end]
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
 * Куда встанет колонка, шагнув влево (`-1`) или вправо (`+1`): позиция ближайшего ВИДИМОГО
 * соседа в этом направлении. `-1` — идти некуда.
 *
 * Шаг меряется видимыми соседями, а не полным порядком (правка 2026-08-13, когда управление
 * переехало в саму колонку). Раньше колонка менялась местами со следующей по полному порядку,
 * и на скрытом соседе нажатие не давало НИКАКОГО видимого эффекта: человек жмёт, экран стоит.
 * Молчаливый холостой ход хуже, чем сдвиг мимо скрытой колонки, — тем более что прежний обмен
 * место скрытой колонки всё равно не сохранял, а менял его на место видимой.
 */
function moveTarget(order: readonly FieldRef[], view: ViewState, from: number, step: -1 | 1): number {
  let to = from + step;
  while (to >= 0 && to < order.length && !isVisible(view, order[to]!)) to += step;
  return to >= 0 && to < order.length ? to : -1;
}

/** Есть ли куда двигать колонку в эту сторону. Управление спрашивает это, чтобы не врать кнопкой. */
export function canMoveColumn(
  columns: ColumnDictionary,
  view: ViewState,
  field: FieldRef,
  step: -1 | 1,
): boolean {
  const order = columnOrder(columns, view);
  const from = order.indexOf(field);
  return from !== -1 && moveTarget(order, view, from, step) !== -1;
}

/**
 * Подвинуть колонку на шаг влево (`-1`) или вправо (`+1`) — то есть за ближайшего видимого
 * соседа. Скрытые колонки при этом остаются на своих местах в порядке, а не тянутся следом.
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

  const to = moveTarget(order, view, from, step);
  if (to === -1) return view;

  // Вырезать и вставить, а не обменять: между колонкой и соседом могут стоять скрытые, и
  // обмен перебросил бы их через полстроки.
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, field);

  return { ...view, order: next };
}

/** К какому краю прижата колонка; `null` — ни к какому. */
export function pinnedEdgeOf(view: ViewState, field: FieldRef): "start" | "end" | null {
  if (view.pinned.start.includes(field)) return "start";
  if (view.pinned.end.includes(field)) return "end";
  return null;
}

/**
 * Прижать колонку к краю или отпустить (повторное нажатие на тот же край).
 *
 * Колонка не может быть прижата к обоим краям сразу — перед прижатием её снимают с другого.
 */
export function pinColumn(view: ViewState, field: FieldRef, edge: "start" | "end" | null): ViewState {
  const start = view.pinned.start.filter((name) => name !== field);
  const end = view.pinned.end.filter((name) => name !== field);

  const pinned: PinnedEdges =
    edge === "start"
      ? { start: [...start, field], end }
      : edge === "end"
        ? { start, end: [...end, field] }
        : { start, end };

  return { ...view, pinned };
}

/** Наименьшая ширина колонки в пикселях: уже этого заголовок нечитаем. */
export const MIN_COLUMN_WIDTH = 48;

/** Шаг изменения ширины с клавиатуры: тянуть мышью умеют не все. */
export const COLUMN_WIDTH_STEP = 16;

/** Задать ширину колонки. `null` — вернуть измерение разметке. */
export function setColumnWidth(view: ViewState, field: FieldRef, width: number | null): ViewState {
  const widths = { ...view.widths };
  if (width === null) delete widths[field];
  else widths[field] = Math.max(MIN_COLUMN_WIDTH, Math.round(width));
  return { ...view, widths };
}

/**
 * Собрать строки в группы по полю или разобрать обратно.
 *
 * Уровни складываются в порядке нажатий: сначала по региону, потом внутри него по статусу —
 * это и есть вложенность, и переставлять её самим нельзя, она сказана пользователем.
 */
export function toggleGrouping(view: ViewState, field: FieldRef): ViewState {
  return {
    ...view,
    grouping: view.grouping.includes(field)
      ? view.grouping.filter((name) => name !== field)
      : [...view.grouping, field],
  };
}

/** Размер страницы; `null` — показывать всё без листания. */
export function setPageSize(view: ViewState, size: number | null): ViewState {
  return { ...view, pageSize: size === null ? null : Math.max(1, Math.round(size)) };
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

/** Поля, по которым группировать разрешено словарём. */
export function groupableColumns(columns: ColumnDictionary): ColumnSpec[] {
  return columns.filter(groupableBy);
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

function parseSorting(input: unknown): SortRule[] | string {
  if (!Array.isArray(input)) return "сортировка: должна быть массивом";

  const sorting: SortRule[] = [];
  const seen = new Set<string>();

  for (const [index, rule] of input.entries()) {
    const where = `ключ сортировки №${index + 1}`;
    if (!isObject(rule)) return `${where}: должен быть объектом`;

    const field = rule["field"];
    const direction = rule["direction"];
    if (typeof field !== "string" || !isFieldRef(field)) {
      return `${where}: поле «${String(field)}» — не путь вида «/имя»`;
    }
    if (direction !== "asc" && direction !== "desc") {
      return `${where}: направление «${String(direction)}» неизвестно`;
    }
    // Один и тот же ключ дважды — противоречие, а не мелочь: какой из них главнее, сказать
    // нечем, и вид пришлось бы толковать наугад.
    if (seen.has(field)) return `${where}: поле «${field}» уже участвует`;

    seen.add(field);
    sorting.push({ field, direction });
  }

  return sorting;
}

function parsePinned(input: unknown): PinnedEdges | string {
  if (input === undefined) return { start: [], end: [] };
  if (!isObject(input)) return "закреплённые колонки: должно быть объектом";

  const start = refList(input["start"] ?? [], "закреплённые слева");
  if (typeof start === "string") return start;

  const end = refList(input["end"] ?? [], "закреплённые справа");
  if (typeof end === "string") return end;

  const both = start.find((name) => end.includes(name));
  if (both !== undefined) {
    return `закреплённые колонки: «${both}» прижата к обоим краям сразу`;
  }

  return { start, end };
}

function parseWidths(input: unknown): Record<FieldRef, number> | string {
  if (input === undefined) return {};
  if (!isObject(input)) return "ширины: должно быть объектом";

  const widths: Record<FieldRef, number> = {};
  for (const [field, width] of Object.entries(input)) {
    if (!isFieldRef(field)) return `ширины: «${field}» — не путь вида «/имя»`;
    if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) {
      return `ширины: у «${field}» ширина «${String(width)}» — не положительное число`;
    }
    widths[field] = width;
  }
  return widths;
}

/**
 * Прочитать вид из чужих данных: ошибка строкой с адресом, а не исключением.
 *
 * Версия 1 поднимается до текущей: недостающие поля второй волны получают умолчания. Это и
 * есть работа версии формата — старое состояние читается, а не выбрасывается.
 */
export function parseView(input: unknown): ParsedView {
  if (!isObject(input)) return { ok: false, error: "вид должен быть объектом" };

  const version = input["version"];
  if (version !== 1 && version !== VIEW_FORMAT_VERSION) {
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

  const sorting = parseSorting(input["sorting"]);
  if (typeof sorting === "string") return { ok: false, error: sorting };

  const pinned = parsePinned(input["pinned"]);
  if (typeof pinned === "string") return { ok: false, error: pinned };

  const widths = parseWidths(input["widths"]);
  if (typeof widths === "string") return { ok: false, error: widths };

  const grouping = refList(input["grouping"] ?? [], "группировка");
  if (typeof grouping === "string") return { ok: false, error: grouping };

  const rawPageSize = input["pageSize"] ?? null;
  if (rawPageSize !== null && (typeof rawPageSize !== "number" || rawPageSize < 1)) {
    return { ok: false, error: `размер страницы «${String(rawPageSize)}» — не число больше нуля` };
  }

  return {
    ok: true,
    view: {
      version: VIEW_FORMAT_VERSION,
      order,
      hidden,
      sorting,
      pinned,
      widths,
      grouping,
      pageSize: rawPageSize === null ? null : Math.round(rawPageSize),
    },
  };
}

/** Отдать вид наружу копией. */
export function serializeView(view: ViewState): ViewState {
  return JSON.parse(JSON.stringify(view)) as ViewState;
}
