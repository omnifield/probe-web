import { scaleLinear } from "d3-scale";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WIDTH = 360;
const HEIGHT = 240;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 40 };

const x = scaleLinear()
  .domain([0, 100])
  .range([MARGIN.left, WIDTH - MARGIN.right]);
const y = scaleLinear()
  .domain([0, 50])
  .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

export const basic: PassportAssembly<DiagramPart> = {
  name: "basic",
  means: "система координат: одна ось x (снизу), одна ось y (слева), фоновая сетка, без серий",
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
      { node: "axis", props: { scale: x, orientation: "x", offset: HEIGHT - MARGIN.bottom } },
      { node: "axis", props: { scale: y, orientation: "y", offset: MARGIN.left } },
    ],
  },
};
