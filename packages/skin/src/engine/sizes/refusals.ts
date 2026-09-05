
import { DENSITY_TOKEN } from "@web-core/style";
import { fluidRefusals, isFluid } from "../fluid/index.js";
import type { SkinVariables } from "../recipe/index.js";
import { BY_SEED, declaredScales, SIZE_SEEDS } from "./scales.js";

export interface SizeSeed {
  readonly name: string;
  readonly value: string;
}

export interface SizeRefusal {
  readonly seed: string;
  readonly means: string;
}

export function sizeRefusals(variables: SkinVariables | undefined): readonly SizeRefusal[] {
  const sown = variables?.dimensions ?? {};
  const refusals: SizeRefusal[] = [];

  for (const [seed, declaration] of Object.entries(sown)) {
    if (isFluid(declaration)) {
      for (const bad of fluidRefusals(seed, declaration)) refusals.push(bad);
    }
  }

  for (const seed of Object.keys(sown)) {
    if (BY_SEED.has(seed) || seed === DENSITY_TOKEN) continue;
    refusals.push({
      seed,
      means: `size scale "${seed}" does not exist. Declared seeds: ${SIZE_SEEDS.join(", ")}`,
    });
  }

  const density = sown[DENSITY_TOKEN] !== undefined;
  if (!density) {
    for (const scale of declaredScales(variables).filter((scale) => scale.density)) {
      refusals.push({
        seed: scale.seed,
        means:
          `scale "${scale.seed}" is scaled by density, but seed "${DENSITY_TOKEN}" is not declared. ` +
          "Each of its steps references an undeclared name, and the browser drops the step entirely " +
          "— the geometry doesn't degrade, it disappears",
      });
    }
  }

  return refusals;
}
