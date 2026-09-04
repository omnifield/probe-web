// Design notes: ./README.md#basis

import { axisOf } from "@web-core/style";

export type FluidBarKind = "unexpressible" | "different-basis" | "unknown-unit";

export interface FluidBar {
  readonly kind: FluidBarKind;
  readonly means: string;
}

// Keys mirror the `unit` values `@web-core/style`'s `AXES` actually declares
// (`packages/style/src/axes.ts`) — "множитель" is real external data, not a name we chose, and
// must match verbatim or the lookup below silently misses.
const FLUID_BASIS: Readonly<Record<string, FluidBar | "fluid">> = {
  rem: "fluid",
  px: "fluid",
  "множитель": {
    kind: "unexpressible",
    means:
      "a dimensionless multiplier with a viewport-width share does not add up at all: " +
      "`calc(0.9 + 0.05vw)` is invalid, and the browser drops the whole declaration. Density can " +
      "never be fluid, no matter how it's written",
  },
  em: {
    kind: "different-basis",
    means:
      "`em` is a share of the node's OWN font size, while the slope is set from viewport width. " +
      "The expression is valid and the browser accepts it — but the same declaration would mean " +
      "something DIFFERENT on nodes with different font sizes. The ban is not about syntax, it's " +
      "about meaning",
  },
};

export function barOf(name: string): FluidBar | null {
  const unit = axisOf(name)?.unit ?? "";
  const basis = FLUID_BASIS[unit];

  if (basis === "fluid") return null;

  return (
    basis ?? {
      kind: "unknown-unit",
      means:
        `unit "${unit}" is unknown to the mechanic, and an axis with it is not considered fluid: ` +
        "whether it has one basis for the whole page is a question that needs a decision, not a default",
    }
  );
}

export function fluidBar(name: string): FluidBarKind | null {
  return barOf(name)?.kind ?? null;
}
