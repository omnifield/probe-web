import type { ScaleLinear } from "d3-scale";
import { For, Show, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../address.js";
import { traceLife } from "../../trace.js";
import { anatomyParts } from "../entity/anatomy.js";

// xy — the coordinate system shared by every cartesian diagram (line/area/bar/point, roadmap
// milestone 2, Diagrams workspace). Hand-authored, no library underneath the rendering itself —
// the same standing the kit's own `table` has. The MATH is not hand-rolled: `d3-scale` computes
// value → pixel (`d3-scale@4.0.2`, `products/diagrams` `package.json`) — the same "take the
// engine, write the components" split the kit's own table takes with `@tanstack/solid-table` for
// sort order, and the same architecture visx (Airbnb) uses at scale for real charts, not just
// simple ones (разбор — DI workspace, «Основания: что берём из открытого кода»).
//
// SCALE IS AN EXPLICIT PROP, never read from context — the one architectural principle taken
// from visx's own README verbatim ("prop-based composition rather than context-based
// injection"): whoever assembles a chart computes the scale once (`scaleLinear().domain(...).
// range(...)`) and hands it to every part that needs it. `Xy` (the root) does not compute or own
// a scale itself — it is a plain sized `<svg>`, nothing more, the same "root is a wrapper, not a
// state owner" shape visx's own `Group` follows.
//
// `stroke="currentColor"`/`fill="currentColor"` on every drawn line/text (found missing live,
// 2026-08-27 — bare SVG shapes have NO default stroke at all per spec, unlike `<text>`'s own
// default fill; the axis was real in the DOM but genuinely invisible). Same device
// `products/tables/src/chart/chart.tsx`'s own file header already names for its own hand-rolled
// SVG chart: "цвет и вид — за потребителем (`fill="currentColor"` — он и переопределяется)" — a
// real, themeable value, not a hardcoded color, the minimum needed for a headless SVG shape to
// show up at all without a skin.

/** Props of `Xy` — the root. `width`/`height` are how a real caller uses it; see the file header. */
export type XyProps = Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "width" | "height"> & {
  width?: number;
  height?: number;
};

/**
 * The xy family's root — ONE real `<svg>`, sized explicitly. Wraps `axis` (and, later, series
 * layers) — a plain container, not a state owner.
 *
 * @example
 * ```tsx
 * const x = scaleLinear().domain([0, 100]).range([0, 300]);
 * const y = scaleLinear().domain([0, 50]).range([200, 0]);
 *
 * <Xy width={320} height={220}>
 *   <XyAxis scale={x} orientation="x" offset={200} />
 *   <XyAxis scale={y} orientation="y" />
 * </Xy>
 * ```
 */
export function Xy(props: XyProps) {
  traceLife("xy.root");

  const [local, rest] = splitProps(props, ["width", "height"]);

  return (
    <svg
      {...dropAddress(rest)}
      width={local.width}
      height={local.height}
      viewBox={`0 0 ${local.width} ${local.height}`}
      {...anatomyParts.root.attrs}
    />
  );
}

export type XyAxisOrientation = "x" | "y";

export type XyAxisProps = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  /**
   * `d3-scale` instance — computed by the caller, handed down explicitly (see file header).
   *
   * OPTIONAL, and not for a real caller's sake: the showcase's own assembly previewer
   * (`packages/assembly/src/render.tsx`) is a SECOND real caller, the same standing the kit's own
   * `table`'s own `children` prop has for the identical reason — it hands every node's props
   * whatever a declared `PassportAssembly` names, and a bare-anatomy sketch (no assembly
   * declared) names none at all. A real, hand-written caller always has a scale to give; the
   * fallback below is what a caller with nothing to give sees instead of a thrown exception.
   */
  scale?: ScaleLinear<number, number>;
  orientation?: XyAxisOrientation;
  /** How many ticks to ask the scale for — a hint, `d3-scale` rounds to "nice" values on its own. */
  ticks?: number;
  tickFormat?: (value: number) => string;
  /** Where this axis's own baseline sits on the CROSS axis — an x-axis's own y position, or the reverse. */
  offset?: number;
};

const DEFAULT_TICK_FORMAT = (value: number): string => String(value);

/**
 * One axis — ONE real `<g>`, drawing a domain line plus tick marks and labels along `scale`'s
 * own range. `orientation` picks which side the ticks fall on: `"x"` draws below the domain line
 * (a bottom axis), `"y"` draws to its left (a left axis) — the two placements every xy chart
 * needs; top/right axes are not built here (`не строить вперёд спроса`, no caller has needed one
 * yet, the same restraint the kit's own `grid` anatomy names for its own `cell` part).
 *
 * No `scale` — draws its own real address (`<g data-part="axis">`), nothing inside: a skin can
 * still key a rule on it, there just isn't a domain to compute ticks from (see `XyAxisProps`'s
 * own doc comment on `scale`).
 */
export function XyAxis(props: XyAxisProps) {
  traceLife("xy.axis");

  const [local, rest] = splitProps(props, ["scale", "orientation", "ticks", "tickFormat", "offset"]);
  const format = () => local.tickFormat ?? DEFAULT_TICK_FORMAT;
  const offset = () => local.offset ?? 0;

  return (
    <g {...dropAddress(rest)} data-orientation={local.orientation} {...anatomyParts.axis.attrs}>
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
