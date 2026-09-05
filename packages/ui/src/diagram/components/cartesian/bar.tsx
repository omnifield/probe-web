import type { ScaleBand, ScaleLinear } from "d3-scale";
import { For, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramBarProps<T> = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children" | "x" | "y"> & {
  data?: readonly T[];
  /** Категориальная шкала (полосы) — даёт положение и ширину каждого столбца. */
  xScale?: ScaleBand<string>;
  yScale?: ScaleLinear<number, number>;
  /** Достаёт категорию (ключ полосы) из одной точки данных. */
  x: (datum: T) => string;
  /** Достаёт значение из одной точки данных. */
  y: (datum: T) => number;
};

interface BarRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DiagramBar<T>(props: DiagramBarProps<T>) {
  traceLife("ui.diagram-bar");

  const [local, rest] = splitProps(props, ["data", "xScale", "yScale", "x", "y"]);

  const bars = (): readonly BarRect[] => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return [];

    const baseline = yScale.range()[0];

    return data.flatMap((datum) => {
      const key = x(datum);
      const bandX = xScale(key);
      if (bandX === undefined) return [];

      const barY = yScale(y(datum));

      return [{
        key,
        x: bandX,
        y: Math.min(barY, baseline),
        width: xScale.bandwidth(),
        height: Math.abs(baseline - barY),
      }];
    });
  };

  return (
    <g {...dropAddress(rest)} {...anatomyParts.bar.attrs}>
      <For each={bars()}>
        {(bar) => <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="currentColor" />}
      </For>
    </g>
  );
}
