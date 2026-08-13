// ГРАНИЦА МОДУЛЯ ГРАФИКА — единственная опубликованная поверхность.
//
// График берёт общую середину зоны (показ и сведение) и словарь полей — тот же, что у
// таблицы. Про таблицу он не знает ничего, кроме её словаря, а про фильтры знает ровно одно:
// выделение переводится в ИХ условие. Обратных зависимостей нет.
//
// `trace.js` наружу не выходит: замер — внутреннее дело модуля.

export { Chart, ChartLegend, type ChartLegendProps, type ChartProps } from "./chart.jsx";
export {
  type AggregateKind,
  CHART_FORMAT_VERSION,
  type ChartOrder,
  type ChartSpec,
  type FieldRef,
  type Mark,
  MARK_LABELS,
  type MeasureSpec,
  MISSING_KEY,
  MISSING_LABEL,
  ORDER_LABELS,
  OTHER_KEY,
  OTHER_LABEL,
  type Row,
} from "./model.js";
export { bandScale, type BandScale, linearScale, type LinearScale } from "./scale.js";
export { type ChartSelection, selectionCondition, seriesCondition } from "./select.js";
export { buildChart, type ChartData, type ChartPoint, type ChartSeries } from "./transform.js";
export { type ChartSql, type ChartSqlOptions, chartToSql } from "./sql.js";
