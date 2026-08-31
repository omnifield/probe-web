// Design notes: ./README.md#scales

import { DENSITY_TOKEN, DERIVED_SCALES, type DerivedScale } from "@omnifield/probe-web-style";
import type { SkinVariables } from "../recipe/index.js";

export const BY_SEED = new Map<string, DerivedScale>(DERIVED_SCALES.map((scale) => [scale.seed, scale]));

export const SIZE_SEEDS: readonly string[] = [...DERIVED_SCALES.map((scale) => scale.seed), DENSITY_TOKEN];

export function declaredScales(variables: SkinVariables | undefined): DerivedScale[] {
  const sown = variables?.dimensions ?? {};
  return DERIVED_SCALES.filter((scale) => sown[scale.seed] !== undefined);
}
