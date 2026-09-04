import type { ScaleLinear } from "d3-scale";
import { For, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramPointProps<T> = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children" | "x" | "y"> & {
  data?: readonly T[];
  xScale?: ScaleLinear<number, number>;
  yScale?: ScaleLinear<number, number>;
  /** Достаёт значение по оси x из одной точки данных — само значение, не уже пересчитанный пиксель. */
  x: (datum: T) => number;
  /** То же самое для оси y. */
  y: (datum: T) => number;
  /** Радиус каждой точки в пикселях. */
  radius?: number;
};

interface Point {
  cx: number;
  cy: number;
}

export function DiagramPoint<T>(props: DiagramPointProps<T>) {
  traceLife("ui.diagram-point");

  const [local, rest] = splitProps(props, ["data", "xScale", "yScale", "x", "y", "radius"]);

  const points = (): readonly Point[] => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return [];

    return data.map((datum) => ({ cx: xScale(x(datum)), cy: yScale(y(datum)) }));
  };

  return (
    <g {...dropAddress(rest)} {...anatomyParts.point.attrs}>
      <For each={points()}>
        {(point) => <circle cx={point.cx} cy={point.cy} r={local.radius ?? 3} fill="currentColor" />}
      </For>
    </g>
  );
}
