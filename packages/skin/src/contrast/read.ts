// Design notes: ./README.md#read

import type { Oklch } from "@omnifield/probe-web-style";
import { colourOf, resolve } from "./parse.js";
import type { UnreckonableReason } from "./types.js";

const OUTSIDE = new Set(["none", "inherit", "currentcolor", "unset", "initial", "revert"]);

export function readColour(
  value: string,
  values: Map<string, { value: string }>,
): { colour: Oklch; text: string } | { reason: UnreckonableReason; means: string } {
  const resolved = resolve(value, values);

  if (resolved === undefined) {
    return {
      reason: "outside-skin",
      means: `value "${value}" refers to a name that isn't in the skin`,
    };
  }

  if (OUTSIDE.has(resolved.trim().toLowerCase())) {
    return {
      reason: "outside-skin",
      means: `"${resolved.trim()}" refers outside this coordinate: the skin doesn't say what it will turn out to be`,
    };
  }

  const parsed = colourOf(resolved);

  return parsed.ok ? { colour: parsed.color, text: parsed.text } : { reason: parsed.refusal, means: parsed.means };
}
