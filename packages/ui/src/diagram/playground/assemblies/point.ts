import { scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const data = [
  { hours: 1, score: 52 },
  { hours: 2, score: 61 },
  { hours: 3, score: 58 },
  { hours: 4, score: 70 },
  { hours: 5, score: 74 },
  { hours: 6, score: 69 },
  { hours: 7, score: 82 },
  { hours: 8, score: 88 },
];

const x = scaleLinear()
  .domain([0, 9])
  .range([MARGIN.left, WIDTH - MARGIN.right]);
const y = scaleLinear()
  .domain([40, 100])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const point: PassportAssembly<DiagramPart> = {
  name: "point",
  means: "рассеяние: результат теста по часам подготовки, без соединяющей линии",
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
        node: "point",
        props: {
          data,
          xScale: x,
          yScale: y,
          x: (datum: (typeof data)[number]) => datum.hours,
          y: (datum: (typeof data)[number]) => datum.score,
        },
      },
      { node: "axis", props: { scale: x, orientation: "x", offset: HEIGHT - MARGIN.bottom } },
      { node: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
    ],
  },
};
