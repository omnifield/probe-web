
import type { SkinRule } from "../rules/index.js";

export function dressed(rules: readonly SkinRule[]): { parts: Set<string>; states: Set<string> } {
  const parts = new Set<string>();
  const states = new Set<string>();

  for (const { coordinate } of rules) {
    const part = `${coordinate.component}.${coordinate.part}`;
    parts.add(part);
    for (const state of coordinate.states) states.add(`${part}:${state}`);
  }

  return { parts, states };
}
