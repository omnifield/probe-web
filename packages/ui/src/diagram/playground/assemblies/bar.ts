import { scaleBand, scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const data = [
  { quarter: "Q1", revenue: 120 },
  { quarter: "Q2", revenue: 190 },
  { quarter: "Q3", revenue: 150 },
  { quarter: "Q4", revenue: 240 },
];

const x = scaleBand<string>()
  .domain(data.map((datum) => datum.quarter))
  .range([MARGIN.left, WIDTH - MARGIN.right])
  .padding(0.2);
const y = scaleLinear()
  .domain([0, 250])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const bar: PassportAssembly<DiagramPart> = {
  name: "bar",
  means: "столбцы: выручка по кварталам, категориальная ось x (без подписей — категориальную ось axis/grid пока не умеют, ROADMAP.yaml)",
  tree: {
    node: "root",
    props: { width: WIDTH, height: HEIGHT },
    children: [
      {
        node: "grid",
        props: { scale: y, orientation: "y", from: MARGIN.left, to: WIDTH - MARGIN.right },
      },
      {
        node: "bar",
        props: {
          data,
          xScale: x,
          yScale: y,
          x: (datum: (typeof data)[number]) => datum.quarter,
          y: (datum: (typeof data)[number]) => datum.revenue,
        },
      },
      { node: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
    ],
  },
};
