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

import type { FieldRef, FieldSpec } from "../filters/index.js";
import type { AggregateKind, Presentable } from "../dataset/index.js";

export type { FieldRef, FieldSpec, FieldType, Row } from "../filters/index.js";
export {
  AGGREGATE_LABELS,
  type AggregateKind,
  defaultFormat,
  FORMAT_LABELS,
  type FormatKind,
  type FormatOptions,
  formatOf,
  type Presentable,
} from "../dataset/index.js";

/**
 * Колонка = поле из словаря плюс показ и поведение в таблице.
 *
 * Показ (`format`) описан общей серединой (`Presentable`), а не заведён здесь: график
 * показывает значения теми же правилами, и второе описание разъехалось бы с первым.
 */
export interface ColumnSpec extends FieldSpec, Presentable {
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

