// Design notes: ./README.md

import type { Skin } from "../recipe/index.js";
import { sizeValues } from "../sizes/index.js";
import { trace } from "../trace/index.js";
import { seeded } from "./build.js";
import type { SkinHalf, SkinValue } from "./types.js";

export type { SkinHalf, SkinValue, ValueOrigin } from "./types.js";
export { NOT_SEEDED } from "./not-seeded.js";
export { seedRefusals, type SeedRefusal } from "./refusals.js";

export function skinValues(skin: Skin, half: SkinHalf): Map<string, SkinValue> {
  const done = trace(`skinValues(${skin.name}, ${half})`);

  const literal = (source: Readonly<Record<string, string>> | undefined): [string, SkinValue][] =>
    Object.entries(source ?? {}).map(([name, value]) => [name, { value, from: "literal" }]);

  const values = new Map<string, SkinValue>(
    half === "light"
      ? [...seeded(skin.variables, "light"), ...literal(skin.variables?.light)]
      : [...literal(skin.variables?.light), ...seeded(skin.variables, "dark"), ...literal(skin.variables?.dark)],
  );

  done();
  return values;
}

export function valueNames(skin: Skin): Set<string> {
  return new Set([...skinValues(skin, "light").keys(), ...skinValues(skin, "dark").keys(), ...sizeValues(skin).keys()]);
}
