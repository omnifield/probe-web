// Спецификация графика → хвост запроса: сведение и группировка.
//
// Третья часть показа для бэка (условие отбора — в `filters/sql.ts`, порядок и страница — в
// `table/sql.ts`). Она нужна отдельно, потому что график шлёт бэку НЕ ТО ЖЕ, что таблица:
// таблице нужны строки, графику — уже сведённые величины. Один и тот же отбор, разные хвосты.
//
// Сведение делается ДО отрисовки — так нормирует Vega-Lite («Aggregate summarizes a table as one
// record for each group»), и ровно это выражает `GROUP BY`. Поле без функции сведения — поле
// группировки; у нас это срез, и в SQL он попадает и в `SELECT`, и в `GROUP BY`.
//
// Имена методов у нас рыночные (OData Data Aggregation), и в SQL они переводятся один в один,
// кроме двух: `average` → `AVG`, `countdistinct` → `COUNT(DISTINCT …)`.

import { sqlColumn, type SqlDialect } from "../filters/index.js";
import type { AggregateKind } from "../dataset/index.js";
import type { ChartSpec } from "./model.js";

export interface ChartSqlOptions {
  dialect?: SqlDialect;
}

export interface ChartSql {
  /** Что выбираем: срез, серия и сведённая мера. */
  select: string;
  /** `GROUP BY …` — по срезу и, если есть, по серии. */
  groupBy: string;
  /** `ORDER BY …` — по величине или по названию категории. */
  order: string;
  notes: string[];
}

/** Метод сведения → функция SQL. `count` считает СТРОКИ, остальные — значения поля. */
function aggregated(kind: AggregateKind, column: string | null): string {
  switch (kind) {
    case "count":
      return "COUNT(*)";
    case "countdistinct":
      return column === null ? "COUNT(*)" : `COUNT(DISTINCT ${column})`;
    case "average":
      return column === null ? "COUNT(*)" : `AVG(${column})`;
    default:
      return column === null ? "COUNT(*)" : `${kind.toUpperCase()}(${column})`;
  }
}

/**
 * Хвост запроса для графика.
 *
 * @param spec что рисуем: срез, мера, серии, порядок
 * @param options диалект
 */
export function chartToSql(spec: ChartSpec, options: ChartSqlOptions = {}): ChartSql {
  const dialect = options.dialect ?? "standard";
  const notes: string[] = [];

  const slice = sqlColumn(spec.slice, dialect);
  const series = spec.series === undefined ? null : sqlColumn(spec.series, dialect);
  const measureColumn = spec.measure.field === undefined ? null : sqlColumn(spec.measure.field, dialect);
  const measure = aggregated(spec.measure.aggregate, measureColumn);

  const columns = [`${slice} AS slice`, ...(series === null ? [] : [`${series} AS series`]), `${measure} AS value`];
  const groups = [slice, ...(series === null ? [] : [series])];

  // «Как в данных» (`natural`) в SQL не выражается вовсе: порядка строк без `ORDER BY` там нет,
  // и обещать его нельзя. Поэтому для него хвоста не будет, и это честнее выдуманного ключа.
  const order =
    spec.order === "value-desc"
      ? "ORDER BY value DESC"
      : spec.order === "value-asc"
        ? "ORDER BY value ASC"
        : spec.order === "label"
          ? "ORDER BY slice ASC"
          : "";

  notes.push(
    "Строки без значения среза у нас — ВИДИМАЯ категория, а не выброшенные данные: на сервере это `IS NULL`, а не `WHERE slice IS NOT NULL`, иначе «всего» на графике и в таблице разъедется.",
  );

  if (spec.limit !== undefined) {
    notes.push(
      "«Прочее» мы собираем ПОСЛЕ сведения и только из двух и более категорий — на сервере это отдельный шаг, а не `LIMIT`: обрезанный список молча уменьшил бы «всего».",
    );
  }

  return { select: `SELECT ${columns.join(", ")}`, groupBy: `GROUP BY ${groups.join(", ")}`, order, notes };
}
