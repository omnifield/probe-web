// Design notes: ./README.md#build

import { buildAlphaScale, buildChartScale, buildScale, buildScrim, tryParseColor } from "@omnifield/probe-web-style";
import type { SeededScale, SkinVariables } from "../recipe/index.js";
import { declared } from "./declare.js";
import type { SkinHalf, SkinValue } from "./types.js";

function scaleValues(name: string, scale: SeededScale, mode: SkinHalf): Map<string, SkinValue> {
  const values = new Map<string, SkinValue>();
  const put = (step: string, value: string): void => {
    values.set(`${name}-${step}`, { value, from: "seed", scale: name, step });
  };

  for (const [step, value] of Object.entries(buildScale(scale.seed, mode))) put(step, value);

  if (scale.alpha) {
    for (const [step, value] of Object.entries(buildAlphaScale(scale.seed, mode))) put(step, value);
  }

  if (scale.chart) {
    buildChartScale(scale.seed, mode).forEach((value, index) => put(`chart-${index + 1}`, value));
  }

  if (scale.scrim) put("scrim", buildScrim(scale.seed));

  return values;
}

export function seeded(variables: SkinVariables | undefined, mode: SkinHalf): Map<string, SkinValue> {
  const values = new Map<string, SkinValue>();

  for (const [name, declaration] of Object.entries(variables?.scales ?? {})) {
    const scale = declared(declaration);
    if (!tryParseColor(scale.seed).ok) continue;

    for (const [key, value] of scaleValues(name, scale, mode)) values.set(key, value);
  }

  return values;
}
