import { scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const data = [
  { day: 0, temperature: 12 },
  { day: 1, temperature: 15 },
  { day: 2, temperature: 14 },
  { day: 3, temperature: 18 },
  { day: 4, temperature: 22 },
  { day: 5, temperature: 20 },
  { day: 6, temperature: 17 },
];

const x = scaleLinear()
  .domain([0, 6])
  .range([MARGIN.left, WIDTH - MARGIN.right]);
const y = scaleLinear()
  .domain([0, 25])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const line: PassportAssembly<DiagramPart> = {
  name: "line",
  means: "линейный график: температура по дням недели, одна серия поверх сетки и осей",
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
        node: "line",
        props: {
          data,
          xScale: x,
          yScale: y,
          x: (datum: (typeof data)[number]) => datum.day,
          y: (datum: (typeof data)[number]) => datum.temperature,
        },
      },
      { node: "axis", props: { scale: x, orientation: "x", offset: HEIGHT - MARGIN.bottom } },
      { node: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
    ],
  },
};
