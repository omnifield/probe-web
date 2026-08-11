// ОБЩАЯ СЕРЕДИНА зоны: то, что одинаково нужно и таблице, и графику.
//
// Появилась не «для красоты», а по необходимости: график считает меру по срезу теми же
// правилами, что таблица считает итог, и показывает дату теми же правилами, что таблица
// показывает ячейку. Держать это в таблице значило бы, что график зависит от таблицы, —
// а они РОВНЯ, и такой шов разъехался бы на первой правке (`tasker:TABLES-7`).
//
// Границы середины названы честно:
//   • ЗДЕСЬ — показ значения (`format`) и сведение значений (`aggregate`);
//   • В ФИЛЬТРАХ остаются `Row`, ссылка-путь и словарь полей — они уезжают вместе с
//     фильтрами отдельным продуктом, и утащить их сюда значило бы порвать тот выезд;
//   • канонической формой входа (адаптеры, `tasker:TABLES-3`) середина станет позже — тогда
//     словарь переедет сюда целиком, и это будет объявленный шаг, а не побочный эффект.

export type { FieldRef, FieldSpec, FieldType, Row } from "../filters/index.js";
import type { FieldType } from "../filters/index.js";

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
 * Наименьшее, что нужно знать о поле, чтобы показать его значение.
 *
 * Именно структурный минимум, а не колонка таблицы: график берёт то же самое, но колонкой не
 * является. Требовать здесь `ColumnSpec` значило бы, что показ значения — принадлежность
 * таблицы, а он общий.
 */
export interface Presentable {
  type: FieldType;
  format?: FormatKind;
  formatOptions?: FormatOptions;
}

/**
 * Как сводить много значений в одно.
 *
 * Имена взяты у OData Data Aggregation (Committee Specification 04) — единственного свода,
 * который нормирует и методы (`sum`/`min`/`max`/`average`/`countdistinct`), и особый счёт
 * членов группы (`$count`). Выдумывать свои названия там, где норма есть, — ровно то, чего
 * сверка велит не делать.
 */
export type AggregateKind = "count" | "sum" | "min" | "max" | "average" | "countdistinct";

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

/** Формат поля: заданный явно или выведенный из типа. */
export function formatOf(field: Presentable): FormatKind {
  return field.format ?? defaultFormat(field.type);
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
