
import { DENSITY_TOKEN, GRID_STEP, type DerivedScale, type DerivedStep } from "@web-core/style";
import { fluidExpression, isFluid } from "../fluid/index.js";
import type { Skin } from "../recipe/index.js";
import { trace } from "../../trace/index.js";
import { BY_SEED, declaredScales } from "./scales.js";

function ref(name: string): string {
  return `var(--${name})`;
}

export function stepValue(scale: DerivedScale, step: DerivedStep): string {
  if ("value" in step) return step.value;

  const seed = ref(scale.seed);

  if ("offset" in step) return step.offset ? `calc(${seed} ${step.offset})` : seed;

  const parts = [seed];
  if (step.factor !== 1) parts.push(String(step.factor));
  if (scale.density) parts.push(ref(DENSITY_TOKEN));

  return parts.length === 1 ? seed : `calc(${parts.join(" * ")})`;
}

export function snappedValue(scale: DerivedScale, step: DerivedStep): string | null {
  return scale.snap ? `round(nearest, ${stepValue(scale, step)}, ${GRID_STEP})` : null;
}

export function sizeValues(skin: Skin): Map<string, string> {
  const done = trace(`sizeValues(${skin.name})`);
  const values = new Map<string, string>();

  for (const [seed, declaration] of Object.entries(skin.variables?.dimensions ?? {})) {
    if (!BY_SEED.has(seed) && seed !== DENSITY_TOKEN) continue;

    values.set(seed, isFluid(declaration) ? fluidExpression(declaration) : declaration);
  }

  for (const scale of declaredScales(skin.variables)) {
    for (const step of scale.steps) values.set(step.name, stepValue(scale, step));
  }

  done();
  return values;
}
