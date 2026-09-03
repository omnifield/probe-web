import type { ScaleLinear } from "d3-scale";
import { For, Show, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramAxisOrientation = "x" | "y";

export type DiagramAxisProps = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  /** Посчитана вызывающим и передана явно — часть сама шкалу не считает и не хранит. */
  scale?: ScaleLinear<number, number>;
  orientation?: DiagramAxisOrientation;
  /** Сколько тиков попросить у шкалы — подсказка, d3-scale сама округляет до «красивых» значений. */
  ticks?: number;
  tickFormat?: (value: number) => string;
  /** Где на ПОПЕРЕЧНОЙ оси стоит эта ось — x-оси своя позиция по y, и наоборот. */
  offset?: number;
};

const DEFAULT_TICK_FORMAT = (value: number): string => String(value);

export function DiagramAxis(props: DiagramAxisProps) {
  traceLife("ui.diagram-axis");

  const [local, rest] = splitProps(props, ["scale", "orientation", "ticks", "tickFormat", "offset"]);
  const format = () => local.tickFormat ?? DEFAULT_TICK_FORMAT;
  const offset = () => local.offset ?? 0;

  return (
    <g
      {...dropAddress(rest)}
      data-orientation={local.orientation}
      {...anatomyParts.axis.attrs}
    >
      <Show when={local.scale}>
        {(scale) => {
          const values = () => scale().ticks(local.ticks ?? 5);
          const rangeStart = () => scale().range()[0];
          const rangeEnd = () => scale().range()[1];

          return (
            <>
              <line
                x1={local.orientation === "x" ? rangeStart() : offset()}
                y1={local.orientation === "x" ? offset() : rangeStart()}
                x2={local.orientation === "x" ? rangeEnd() : offset()}
                y2={local.orientation === "x" ? offset() : rangeEnd()}
                fill="none"
                stroke="currentColor"
              />
              <For each={values()}>
                {(value) => {
                  const at = scale()(value);
                  return local.orientation === "x" ? (
                    <g transform={`translate(${at}, ${offset()})`}>
                      <line y2={6} fill="none" stroke="currentColor" />
                      <text y={9} dy="0.71em" text-anchor="middle" fill="currentColor">
                        {format()(value)}
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${offset()}, ${at})`}>
                      <line x2={-6} fill="none" stroke="currentColor" />
                      <text x={-9} dy="0.32em" text-anchor="end" fill="currentColor">
                        {format()(value)}
                      </text>
                    </g>
                  );
                }}
              </For>
            </>
          );
        }}
      </Show>
    </g>
  );
}
