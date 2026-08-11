// Модель таблицы: описание колонок и СОСТОЯНИЕ ВИДА.
//
// Словарь полей НЕ заводится заново — берётся `FieldSpec` модуля фильтров. Так решено
// сознательно: CSVW нормирует табличную модель как «набор строк ПЛЮС отдельное описание
// колонок», где тип объявлен, а не выведен эвристикой; у нас такое описание уже есть, и оно
// одно на отбор и на таблицу. Второй словарь развёл бы фильтр и таблицу на первой правке
// (`tasker:TABLES-5`, сверка 2026-08-11).
//
// Состояние вида (порядок · видимость · сортировка) рынком НЕ нормировано вовсе — перебраны
// WAI-ARIA (про то, что сообщить), CSVW (про данные) и вендорские сохранённые виды (практика
// без общей нормы). Значит форма наша, и берётся та же, что уже работает у фильтра:
// сериализуемая структура с версией формата и проверкой чужого JSON на границе.

import type { FieldRef, FieldSpec, FieldType } from "../filters/index.js";

export type { FieldRef, FieldSpec, FieldType, Row } from "../filters/index.js";

/**
 * Как показывать значение. Это ВИЗУАЛ, а не тип данных: тип говорит, что лежит в поле,
 * формат — каким его видит человек. Одно число бывает и суммой, и процентом, и рейтингом.
 */
export type FormatKind = "text" | "number" | "percent" | "date" | "datetime" | "bool" | "rating";

export interface FormatOptions {
  /** Сколько знаков после запятой у числа и процента. */
  fractionDigits?: number;
  /**
   * Что лежит в поле для процентов: доля (`0.42`) или сотые (`42`).
   *
   * Спрошено явно, а не угадано: молчаливое умножение на сто — самая дешёвая ошибка на свете
   * и самая заметная на экране.
   */
  percentBase?: "fraction" | "hundred";
  /** Верх шкалы рейтинга; уезжает в атрибут, рисует потребитель. */
  ratingMax?: number;
}

/**
 * Как сводить много значений в одно.
 *
 * Имена взяты у OData Data Aggregation (Committee Specification 04) — единственного свода,
 * который нормирует и методы (`sum`/`min`/`max`/`average`/`countdistinct`), и особый счёт
 * членов группы (`$count`). Начинка чужая, имена рыночные: выдумывать свои там, где норма
 * уже есть, — ровно то, чего сверка велит не делать.
 */
export type AggregateKind = "count" | "sum" | "min" | "max" | "average" | "countdistinct";

/** Колонка = поле из словаря плюс то, что относится к показу. */
export interface ColumnSpec extends FieldSpec {
  /** По умолчанию выводится из типа поля. */
  format?: FormatKind;
  formatOptions?: FormatOptions;
  /** По умолчанию сортировать можно. */
  sortable?: boolean;
  /** По умолчанию группировать можно текст и да/нет — см. `groupableBy`. */
  groupable?: boolean;
  /** Чем сводить значения в группе и в итоговой строке. Без него итога у колонки нет. */
  aggregate?: AggregateKind;
}

export type ColumnDictionary = readonly ColumnSpec[];

export type SortDirection = "asc" | "desc";

export interface SortRule {
  field: FieldRef;
  direction: SortDirection;
}

/**
 * Версия формата состояния вида. Поднимается при несовместимом изменении формы.
 *
 * **2** — вторая волна: закрепление колонок, ширины, группировка и размер страницы. Виды
 * версии 1 читаются и поднимаются до 2 разбором (`parseView`): версия для того и заводилась,
 * чтобы старое состояние не выбрасывать молча.
 */
export const VIEW_FORMAT_VERSION = 2;

/** Края, к которым прижаты колонки. */
export interface PinnedEdges {
  start: FieldRef[];
  end: FieldRef[];
}

export interface ViewState {
  version: typeof VIEW_FORMAT_VERSION;
  /**
   * Порядок колонок. Поля, которых здесь нет, идут ПОСЛЕ перечисленных в порядке словаря —
   * иначе добавление колонки в словарь ломало бы каждый сохранённый вид.
   */
  order: FieldRef[];
  /** Скрытые колонки. Хранится скрытое, а не видимое: новая колонка тогда видна по умолчанию. */
  hidden: FieldRef[];
  /** Ключи сортировки по порядку значимости. Пусто — сортировки нет. */
  sorting: SortRule[];
  /** Колонки, прижатые к краям: они уходят из общего порядка к своему краю. */
  pinned: PinnedEdges;
  /** Заданные пользователем ширины в пикселях. Колонки без записи меряет разметка. */
  widths: Record<FieldRef, number>;
  /** Поля, по которым строки собраны в группы. Порядок задаёт вложенность уровней. */
  grouping: FieldRef[];
  /** Строк на странице. `null` — листания нет, показываем всё. */
  pageSize: number | null;
}

export const EMPTY_VIEW: ViewState = {
  version: VIEW_FORMAT_VERSION,
  order: [],
  hidden: [],
  sorting: [],
  pinned: { start: [], end: [] },
  widths: {},
  grouping: [],
  pageSize: null,
};

/**
 * Состояние СЕАНСА — то, что живёт до перезагрузки и НЕ сохраняется.
 *
 * Разведено с видом намеренно. Вид — это «как я смотрю на данные»: его сохраняют, возят с
 * собой и версионируют. Страница, раскрытые группы, выделенные и закреплённые строки — это
 * «где я сейчас»; они привязаны к конкретным строкам и к конкретному моменту, и сохранять их
 * вместе с видом значит однажды восстановить выделение строк, которых больше нет. Поэтому у
 * сеанса нет ни версии, ни разбора с границы.
 */
export interface SessionState {
  /** Номер страницы с нуля. */
  page: number;
  /** Раскрытые группы по идентификатору строки; `"all"` — раскрыты все. */
  expanded: string[] | "all";
  /** Выделенные строки по идентификатору. */
  selected: string[];
  /** Строки, прижатые к верху и низу таблицы. */
  pinnedRows: { top: string[]; bottom: string[] };
}

export const EMPTY_SESSION: SessionState = {
  page: 0,
  expanded: [],
  selected: [],
  pinnedRows: { top: [], bottom: [] },
};

/**
 * Можно ли группировать по этому полю.
 *
 * Умолчание — текст и да/нет: группировка по сумме или по дате даёт столько же групп, сколько
 * строк, и это не группировка, а тот же список с отступами. Колонка вправе решить иначе.
 */
export function groupableBy(column: ColumnSpec): boolean {
  return column.groupable ?? (column.type === "text" || column.type === "bool");
}

/** Формат по умолчанию — от типа поля. */
export function defaultFormat(type: FieldType): FormatKind {
  switch (type) {
    case "number":
      return "number";
    case "date":
      return "date";
    case "bool":
      return "bool";
    case "text":
      return "text";
  }
}

/** Формат колонки: заданный явно или выведенный из типа. */
export function formatOf(column: ColumnSpec): FormatKind {
  return column.format ?? defaultFormat(column.type);
}

export const AGGREGATE_LABELS: Record<AggregateKind, string> = {
  count: "сколько",
  sum: "сумма",
  min: "наименьшее",
  max: "наибольшее",
  average: "среднее",
  countdistinct: "различных",
};

export const FORMAT_LABELS: Record<FormatKind, string> = {
  text: "текст",
  number: "число",
  percent: "проценты",
  date: "дата",
  datetime: "дата и время",
  bool: "да/нет",
  rating: "рейтинг",
};
