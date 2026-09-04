import { scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const data = [
  { day: 0, visitors: 120 },
  { day: 1, visitors: 150 },
  { day: 2, visitors: 90 },
  { day: 3, visitors: 200 },
  { day: 4, visitors: 260 },
  { day: 5, visitors: 210 },
  { day: 6, visitors: 170 },
];

const x = scaleLinear()
  .domain([0, 6])
  .range([MARGIN.left, WIDTH - MARGIN.right]);
const y = scaleLinear()
  .domain([0, 300])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const area: PassportAssembly<DiagramPart> = {
  name: "area",
  means: "график с заливкой: посетители по дням недели, одна серия поверх сетки",
  tree: {
    node: "root",
    props: { width: WIDTH, height: HEIGHT },
    children: [
      {
        node: "grid",
        props: { scale: x, orientation: "x", from: MARGIN.top, to: HEIGHT - MARGIN.bottom },
      },
      {
        node: "grid",
        props: { scale: y, orientation: "y", from: MARGIN.left, to: WIDTH - MARGIN.right },
      },
      {
        node: "area",
        props: {
          data,
          xScale: x,
          yScale: y,
          x: (datum: (typeof data)[number]) => datum.day,
          y: (datum: (typeof data)[number]) => datum.visitors,
        },
      },
      { node: "axis", props: { scale: x, orientation: "x", offset: HEIGHT - MARGIN.bottom } },
      { node: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
    ],
  },
};
