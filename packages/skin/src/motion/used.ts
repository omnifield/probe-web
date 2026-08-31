// Design notes: ./README.md#used

import type { StyleObject } from "../recipe/index.js";
import { namesMotion } from "./name.js";

export function motionsIn(style: StyleObject, declared: ReadonlySet<string>): Set<string> {
  const found = new Set<string>();
  if (declared.size === 0) return found;

  for (const [property, value] of Object.entries(style)) {
    if (value === undefined) continue;

    if (typeof value === "object") {
      for (const name of motionsIn(value, declared)) found.add(name);
      continue;
    }

    if (!namesMotion(property)) continue;

    for (const word of String(value).split(/[\s,]+/u)) {
      if (declared.has(word)) found.add(word);
    }
  }

  return found;
}
