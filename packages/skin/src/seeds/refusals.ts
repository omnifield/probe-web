// Design notes: ./README.md#refusals

import { tryParseColor, type ColorRefusal } from "@omnifield/probe-web-style";
import type { SkinVariables } from "../recipe/index.js";
import { declared } from "./declare.js";

export interface SeedRefusal {
  readonly scale: string;
  readonly seed: string;
  readonly refusal: ColorRefusal;
  readonly means: string;
}

export function seedRefusals(variables: SkinVariables | undefined): readonly SeedRefusal[] {
  const refusals: SeedRefusal[] = [];

  for (const [scale, declaration] of Object.entries(variables?.scales ?? {})) {
    const { seed } = declared(declaration);
    const parsed = tryParseColor(seed);

    if (!parsed.ok) refusals.push({ scale, seed, refusal: parsed.refusal, means: parsed.means });
  }

  return refusals;
}
