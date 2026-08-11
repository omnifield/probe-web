// Данные → точки графика. СВЕДЕНИЕ ЗДЕСЬ, а не в отрисовке.
//
// Правило взято дословно: «Aggregate summarizes a table as one record for each group», и поля
// без функции сведения — поля группировки. У нас группирующее поле одно (`slice`) плюс
// необязательная разбивка на серии, а сведение считает общая середина зоны — та же, что
// считает итоги в таблице. Одна мера, посчитанная двумя разными способами в графике и в
// таблице, — это расхождение, которое человек увидит раньше нас.

import { aggregate, type AggregatableField, formatValue, type Row } from "../dataset/index.js";
import { lookup } from "../filters/index.js";
import type { ColumnDictionary, ColumnSpec } from "../table/index.js";
import {
  type ChartSpec,
  MISSING_KEY,
  MISSING_LABEL,
  OTHER_KEY,
  OTHER_LABEL,
} from "./model.js";

/** Одна посчитанная величина: срез, значение и сколько строк в него вошло. */
export interface ChartPoint {
  /** Ключ среза — он же уедет в условие фильтра при выделении. */
  key: string;
  label: string;
  /** `null` — считать было нечего; это НЕ ноль. */
  value: number | null;
  /** Сколько строк в группе — счёт членов, как `$count`. */
  count: number;
}

export interface ChartSeries {
  key: string;
  label: string;
  points: ChartPoint[];
}

export interface ChartData {
  categories: Array<{ key: string; label: string }>;
  series: ChartSeries[];
  /** Домен значений после приведения к нулю (для столбиков). */
  min: number;
  max: number;
  /** Сколько строк не попало ни в одну категорию (у среза не было значения). */
  missing: number;
  empty: boolean;
}

function specOf(columns: ColumnDictionary, field: string | undefined): ColumnSpec | undefined {
  return field === undefined ? undefined : columns.find((column) => column.name === field);
}

/** Ключ группы: строковая форма значения. `null`/отсутствие — отдельная категория. */
function keyOf(row: Row, field: string): string {
  const found = lookup(row, field);
  if (!found.found || found.value === null || found.value === undefined) return MISSING_KEY;
  const text = String(found.value);
  return text.trim() === "" ? MISSING_KEY : text;
}

function labelOf(key: string, column: ColumnSpec | undefined, locale: string): string {
  if (key === MISSING_KEY) return MISSING_LABEL;
  if (key === OTHER_KEY) return OTHER_LABEL;
  return column ? formatValue(key, column, locale).text : key;
}

function measureField(spec: ChartSpec, columns: ColumnDictionary): AggregatableField {
  const declared = specOf(columns, spec.measure.field);
  if (declared) return declared;
  // Счёт членов группы поля не разбирает — ему довольно любого адреса. Для остальных методов
  // отсутствие поля означает, что считать нечего, и это честно вернётся как `null`.
  return { name: spec.measure.field ?? spec.slice, type: "number" };
}

function sortCategories(
  categories: Array<{ key: string; label: string }>,
  totals: Map<string, number | null>,
  spec: ChartSpec,
  locale: string,
): Array<{ key: string; label: string }> {
  const order = spec.order ?? "natural";
  if (order === "natural") return categories;

  const value = (key: string): number => totals.get(key) ?? Number.NEGATIVE_INFINITY;

  return [...categories].sort((a, b) => {
    switch (order) {
      case "label":
        return a.label.localeCompare(b.label, locale);
      case "value-asc":
        return value(a.key) - value(b.key);
      case "value-desc":
        return value(b.key) - value(a.key);
      default:
        return 0;
    }
  });
}

/**
 * Посчитать график.
 *
 * @param rows строки ПОСЛЕ отбора — фильтр это отдельная ступень до графика, а не его часть
 *   (у Vega-Lite ровно так же: `filter` — преобразование над данными до кодирования)
 */
export function buildChart(
  rows: readonly Row[],
  spec: ChartSpec,
  columns: ColumnDictionary,
  locale = "ru-RU",
): ChartData {
  const sliceColumn = specOf(columns, spec.slice);
  const seriesColumn = specOf(columns, spec.series);
  const measure = measureField(spec, columns);

  // Группируем строки: сначала по серии, внутри — по срезу.
  const bySeries = new Map<string, Map<string, Row[]>>();
  const categoryKeys: string[] = [];
  let missing = 0;

  for (const row of rows) {
    const sliceKey = keyOf(row, spec.slice);
    if (sliceKey === MISSING_KEY) missing += 1;

    const seriesKey = spec.series === undefined ? "" : keyOf(row, spec.series);
    const inSeries = bySeries.get(seriesKey) ?? new Map<string, Row[]>();
    const bucket = inSeries.get(sliceKey) ?? [];

    bucket.push(row);
    inSeries.set(sliceKey, bucket);
    bySeries.set(seriesKey, inSeries);

    if (!categoryKeys.includes(sliceKey)) categoryKeys.push(sliceKey);
  }

  // Итог по категории поперёк серий — по нему же категории упорядочиваются и обрезаются.
  const totals = new Map<string, number | null>();
  for (const key of categoryKeys) {
    const all = [...bySeries.values()].flatMap((inSeries) => inSeries.get(key) ?? []);
    totals.set(key, aggregate(all, measure, spec.measure.aggregate).value);
  }

  let categories = sortCategories(
    categoryKeys.map((key) => ({ key, label: labelOf(key, sliceColumn, locale) })),
    totals,
    spec,
    locale,
  );

  // Хвост за пределом сводится в «прочее» — но только если в нём БОЛЬШЕ одной категории:
  // иначе «прочее» из одной категории просто врёт про её имя.
  let tail: string[] = [];
  if (spec.limit !== undefined && categories.length > spec.limit + 1) {
    tail = categories.slice(spec.limit).map((category) => category.key);
    categories = [...categories.slice(0, spec.limit), { key: OTHER_KEY, label: OTHER_LABEL }];
  }

  const series: ChartSeries[] = [...bySeries.entries()].map(([seriesKey, inSeries]) => ({
    key: seriesKey,
    label: spec.series === undefined ? "" : labelOf(seriesKey, seriesColumn, locale),
    points: categories.map((category) => {
      const bucket =
        category.key === OTHER_KEY
          ? tail.flatMap((key) => inSeries.get(key) ?? [])
          : (inSeries.get(category.key) ?? []);

      return {
        key: category.key,
        label: category.label,
        value: bucket.length === 0 ? null : aggregate(bucket, measure, spec.measure.aggregate).value,
        count: bucket.length,
      };
    }),
  }));

  const values = series.flatMap((one) =>
    one.points.map((point) => point.value).filter((value): value is number => value !== null),
  );

  // Столбик меряется ОТ НУЛЯ: длина столбика читается как величина, и обрезанная ось делает
  // разницу в проценты похожей на разницу в разы. Рынком это не нормировано — наше решение,
  // и оно названо. Линия и точки живут в домене данных: там читается ход, а не длина.
  const withZero = spec.mark === "bar" ? [...values, 0] : values;

  return {
    categories,
    series,
    min: withZero.length === 0 ? 0 : Math.min(...withZero),
    max: withZero.length === 0 ? 0 : Math.max(...withZero),
    missing,
    empty: values.length === 0,
  };
}
