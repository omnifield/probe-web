import type { ScaleLinear } from "d3-scale";
import { area as shapeArea } from "d3-shape";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramAreaProps<T> = Omit<JSX.SvgSVGAttributes<SVGPathElement>, "children" | "d" | "x" | "y"> & {
  data?: readonly T[];
  xScale?: ScaleLinear<number, number>;
  yScale?: ScaleLinear<number, number>;
  /** Достаёт значение по оси x из одной точки данных — само значение, не уже пересчитанный пиксель. */
  x: (datum: T) => number;
  /** То же самое для верхнего края заливки — нижний край берётся с базовой линии `yScale`. */
  y: (datum: T) => number;
};

export function DiagramArea<T>(props: DiagramAreaProps<T>) {
  traceLife("ui.diagram-area");

  const [local, rest] = splitProps(props, ["data", "xScale", "yScale", "x", "y"]);

  const d = (): string | undefined => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return undefined;

    const baseline = yScale.range()[0];
    const generator = shapeArea<T>()
      .x((datum) => xScale(x(datum)))
      .y0(baseline)
      .y1((datum) => yScale(y(datum)));

    return generator(data) ?? undefined;
  };

  return (
    <path
      {...dropAddress(rest)}
      d={d()}
      stroke="none"
      fill="currentColor"
      {...anatomyParts.area.attrs}
    />
  );
}
