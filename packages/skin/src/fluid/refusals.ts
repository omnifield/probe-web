// Design notes: ./README.md#refusals

import { AXES, axisOf } from "@omnifield/probe-web-style";
import { barOf } from "./basis.js";
import { measure } from "./measure.js";
import type { FluidSeed } from "./seed.js";

export interface FluidRefusal {
  readonly seed: string;
  readonly means: string;
}

export function fluidRefusals(name: string, seed: FluidSeed): readonly FluidRefusal[] {
  const refusals: FluidRefusal[] = [];
  const say = (means: string): void => {
    refusals.push({ seed: name, means });
  };

  const unit = axisOf(name)?.unit ?? "";
  const bar = barOf(name);

  if (bar) {
    say(`axis "${name}" is measured in "${unit}" — ${bar.kind}. ${bar.means}`);
    return refusals;
  }

  const narrowValue = measure(seed.narrow);
  if (!narrowValue) {
    say(`the narrow-pole value "${seed.narrow}" does not parse as a number with a unit`);
  } else if (narrowValue.unit !== unit) {
    say(
      `the narrow-pole value is written in "${narrowValue.unit || "no unit"}", but axis "${name}" ` +
        `is measured in "${unit}". Mixing units on one axis would mean half the scale stops ` +
        "following the person's font-size setting",
    );
  }

  const wideValue = measure(seed.wide);
  if (!wideValue) {
    say(`the wide-pole value "${seed.wide}" does not parse as a number with a unit`);
  } else if (wideValue.unit !== unit) {
    say(
      `the wide-pole value is written in "${wideValue.unit || "no unit"}", but axis "${name}" is ` +
        `measured in "${unit}". Mixing units on one axis would mean half the scale stops ` +
        "following the person's font-size setting",
    );
  }

  const narrowWidth = measure(seed.between[0]);
  if (!narrowWidth) {
    say(`pole width "${seed.between[0]}" does not parse as a number with a unit`);
  } else if (narrowWidth.unit !== "px") {
    say(
      `pole width is written in "${narrowWidth.unit || "no unit"}", but widths are declared in ` +
        "pixels: viewport width is a pixel quantity, and a share of it is computed from that same unit",
    );
  }

  const wideWidth = measure(seed.between[1]);
  if (!wideWidth) {
    say(`pole width "${seed.between[1]}" does not parse as a number with a unit`);
  } else if (wideWidth.unit !== "px") {
    say(
      `pole width is written in "${wideWidth.unit || "no unit"}", but widths are declared in ` +
        "pixels: viewport width is a pixel quantity, and a share of it is computed from that same unit",
    );
  }

  if (refusals.length > 0) return refusals;

  const low = narrowValue!;
  const high = wideValue!;

  if (wideWidth!.amount <= narrowWidth!.amount) {
    say(
      `pole widths do not increase: ${seed.between[0]} → ${seed.between[1]}. Nothing grows between ` +
        "them, and there is nothing to divide by",
    );
  }

  if (high.amount < low.amount) {
    say(
      `value decreases: ${seed.narrow} at the narrow pole against ${seed.wide} at the wide pole. A ` +
        "value at a greater width cannot be smaller — that's arithmetic, not taste",
    );
  }

  // "норма" mirrors `@omnifield/probe-web-style`'s `AxisBound.kind` verbatim (external data, not
  // a name we chose) — same reason as `basis.ts`'s "множитель" key.
  const floor = AXES.find((axis) => axis.token === name)?.floor;
  if (floor?.kind === "норма" && floor.value !== null && low.amount < floor.value) {
    say(
      `at the narrow pole ${seed.narrow} is below the floor ${floor.value}${unit}, derived from the ` +
        `norm (${floor.norm ?? "norm"}). ${floor.why}`,
    );
  }

  return refusals;
}
