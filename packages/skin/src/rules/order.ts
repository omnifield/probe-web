// Design notes: ./README.md#order

import type { CssRule } from "./types.js";

export function ordered<R extends CssRule>(rules: R[]): R[] {
  return rules
    .map((rule, index) => ({ rule, index }))
    .sort((a, b) => a.rule.conditions - b.rule.conditions || a.rule.origin - b.rule.origin || a.index - b.index)
    .map((entry) => entry.rule);
}
