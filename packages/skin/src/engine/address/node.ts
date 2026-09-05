
import { NODE_ATTRIBUTE } from "../marks/index.js";
import type { ComponentPassport } from "../passport/form/index.js";
import { attribute } from "./scope.js";
import { partSelector } from "./part.js";
import { stateSelector } from "./state.js";

export function nodeSelector(node: string): string {
  return attribute(NODE_ATTRIBUTE, node);
}

export function ancestorSelector(
  passport: ComponentPassport,
  part: string,
  states: readonly string[] = [],
  variant = "",
): string | undefined {
  const own = partSelector(passport, part);
  if (own === undefined) return undefined;

  let selector = own;
  for (const state of states) {
    const mark = stateSelector(passport, part, state);
    if (mark === undefined) return undefined;
    selector += mark;
  }

  return selector + variant;
}
