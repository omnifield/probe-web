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

/** Колонка = поле из словаря плюс то, что относится к показу. */
export interface ColumnSpec extends FieldSpec {
  /** По умолчанию выводится из типа поля. */
  format?: FormatKind;
  formatOptions?: FormatOptions;
  /** По умолчанию сортировать можно. */
  sortable?: boolean;
}

export type ColumnDictionary = readonly ColumnSpec[];

export type SortDirection = "asc" | "desc";

export interface SortRule {
  field: FieldRef;
  direction: SortDirection;
}

/** Версия формата состояния вида. Поднимается при несовместимом изменении формы. */
export const VIEW_FORMAT_VERSION = 1;

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
}

export const EMPTY_VIEW: ViewState = {
  version: VIEW_FORMAT_VERSION,
  order: [],
  hidden: [],
  sorting: [],
};

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

export const FORMAT_LABELS: Record<FormatKind, string> = {
  text: "текст",
  number: "число",
  percent: "проценты",
  date: "дата",
  datetime: "дата и время",
  bool: "да/нет",
  rating: "рейтинг",
};
