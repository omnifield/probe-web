// ОБЩИЕ ПОМОЩНИКИ TS-ПРИМЕРОВ — узлы композиции и графики. Нужны там, где JSON не хватает:
// частям `diagram` нужны d3-шкалы и функции-аксессоры, в JSON их не записать.
import type { CompositionElement, CompositionSpec } from "@web-core/assembly";
import { scaleBand, scaleLinear, type ScaleLinear } from "d3-scale";

export const text = (value: string): CompositionSpec => ({ genus: "text", value });

export const typography = (variant: string, value: string): CompositionElement => ({
  type: "typography",
  props: { "data-variant": variant },
  children: [text(value)],
});

/** Подпись у кнопки — в `props.label`: кнопка собирает себя сама и текстовых детей не читает. */
export const button = (variant: string, label: string): CompositionElement => ({
  type: "button",
  props: { "data-variant": variant, label },
});

export const flow = (variant: string, items: readonly CompositionElement[]): CompositionElement => ({
  type: "flow",
  props: { "data-variant": variant },
  children: items.map((item) => ({ type: "flow.item", children: [item] })),
});

export const grid = (cells: readonly CompositionElement[], variant = "gallery"): CompositionElement => ({
  type: "grid",
  props: { "data-variant": variant },
  children: cells.map((cell) => ({ type: "grid.cell", children: [cell] })),
});

/** Карточка виджета: заголовок, подпись и тело столбиком. */
export const widget = (title: string, caption: string, ...body: CompositionElement[]): CompositionElement => ({
  type: "surface",
  props: { "data-variant": "raised" },
  children: [flow("column", [typography("label", title), typography("caption", caption), ...body])],
});

export const table = (props: Readonly<Record<string, unknown>>): CompositionElement => ({ type: "table", props });

export const column = (accessorKey: string, header: string) => ({ accessorKey, header });

// --- графики ---

export const CHART = { width: 320, height: 180, margin: { top: 10, right: 10, bottom: 24, left: 40 } } as const;

export type Point = { x: number; y: number };
export type Category = { label: string; value: number };

export const series = (values: readonly number[]): Point[] => values.map((y, x) => ({ x, y }));

const byX = (datum: Point) => datum.x;
const byY = (datum: Point) => datum.y;
const byLabel = (datum: Category) => datum.label;
const byValue = (datum: Category) => datum.value;

// Корень `diagram` рисует svg с `viewBox`, поэтому ширина 100% тянет график по ячейке сетки.
export const diagram = (children: readonly CompositionElement[], height: number = CHART.height): CompositionElement => ({
  type: "diagram",
  props: { width: CHART.width, height, style: { width: "100%", height: "auto" } },
  children,
});

const yScale = (domain: readonly [number, number], height: number = CHART.height) =>
  scaleLinear()
    .domain(domain)
    .range([height - CHART.margin.bottom, CHART.margin.top]);

const gridY = (scale: ScaleLinear<number, number>): CompositionElement => ({
  type: "diagram.grid",
  props: { scale, orientation: "y", from: CHART.margin.left, to: CHART.width - CHART.margin.right, ticks: 4 },
});

const axisY = (scale: ScaleLinear<number, number>): CompositionElement => ({
  type: "diagram.axis",
  props: { scale, orientation: "y", offset: CHART.margin.left, ticks: 4 },
});

const axisX = (scale: ScaleLinear<number, number>): CompositionElement => ({
  type: "diagram.axis",
  props: { scale, orientation: "x", offset: CHART.height - CHART.margin.bottom, ticks: 6 },
});

/** Линейный график по порядковому x: `marks` — какие слои рисовать поверх сетки и осей. */
export function timeChart(
  points: readonly Point[],
  yMax: number,
  marks: readonly ("area" | "line" | "point")[] = ["line"],
): CompositionElement {
  const x = scaleLinear()
    .domain([0, points.length - 1])
    .range([CHART.margin.left, CHART.width - CHART.margin.right]);
  const y = yScale([0, yMax]);

  return diagram([
    gridY(y),
    axisX(x),
    axisY(y),
    ...marks.map(
      (mark): CompositionElement => ({
        type: `diagram.${mark}`,
        props: { data: points, xScale: x, yScale: y, x: byX, y: byY, ...(mark === "point" ? { radius: 2.5 } : {}) },
      }),
    ),
  ]);
}

/** Мини-график без осей для KPI: заливка и линия. */
export function sparkline(points: readonly Point[], height = 56): CompositionElement {
  const values = points.map(byY);
  const x = scaleLinear()
    .domain([0, points.length - 1])
    .range([0, CHART.width]);
  const y = scaleLinear()
    .domain([Math.min(...values), Math.max(...values)])
    .range([height - 4, 4]);

  return diagram(
    (["area", "line"] as const).map((mark) => ({
      type: `diagram.${mark}`,
      props: { data: points, xScale: x, yScale: y, x: byX, y: byY },
    })),
    height,
  );
}

/** Столбцы по категориям. Подписей по x нет — категориальную ось кит пока не умеет (ROADMAP). */
export function barChart(categories: readonly Category[], yMax: number): CompositionElement {
  const x = scaleBand<string>()
    .domain(categories.map(byLabel))
    .range([CHART.margin.left, CHART.width - CHART.margin.right])
    .padding(0.25);
  const y = yScale([0, yMax]);

  return diagram([
    gridY(y),
    { type: "diagram.bar", props: { data: categories, xScale: x, yScale: y, x: byLabel, y: byValue } },
    axisY(y),
  ]);
}

/** Рассеяние по двум числовым осям. */
export function scatter(points: readonly Point[], xMax: number, yMax: number): CompositionElement {
  const x = scaleLinear()
    .domain([0, xMax])
    .range([CHART.margin.left, CHART.width - CHART.margin.right]);
  const y = yScale([0, yMax]);

  return diagram([
    gridY(y),
    axisX(x),
    axisY(y),
    { type: "diagram.point", props: { data: points, xScale: x, yScale: y, x: byX, y: byY, radius: 3.5 } },
  ]);
}
