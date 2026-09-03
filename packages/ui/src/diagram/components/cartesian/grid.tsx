import type { ScaleLinear } from "d3-scale";
import { For, Show, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import type { DiagramAxisOrientation } from "./axis.js";

export type DiagramGridProps = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  /** Та же шкала, что несёт соответствующая `axis` — тики берутся из неё же, не пересчитываются. */
  scale?: ScaleLinear<number, number>;
  orientation?: DiagramAxisOrientation;
  ticks?: number;
  /** Где линии начинаются на ПОПЕРЕЧНОЙ оси — обычно край диапазона другой шкалы. */
  from?: number;
  /** Где линии заканчиваются на ПОПЕРЕЧНОЙ оси. */
  to?: number;
};

export function DiagramGrid(props: DiagramGridProps) {
  traceLife("ui.diagram-grid");

  const [local, rest] = splitProps(props, ["scale", "orientation", "ticks", "from", "to"]);
  const from = () => local.from ?? 0;
  const to = () => local.to ?? 0;

  return (
    <g
      {...dropAddress(rest)}
      data-orientation={local.orientation}
      {...anatomyParts.grid.attrs}
    >
      <Show when={local.scale}>
        {(scale) => (
          <For each={scale().ticks(local.ticks ?? 5)}>
            {(value) => {
              const at = scale()(value);
              return local.orientation === "x" ? (
                <line x1={at} y1={from()} x2={at} y2={to()} fill="none" stroke="currentColor" />
              ) : (
                <line x1={from()} y1={at} x2={to()} y2={at} fill="none" stroke="currentColor" />
              );
            }}
          </For>
        )}
      </Show>
    </g>
  );
}
