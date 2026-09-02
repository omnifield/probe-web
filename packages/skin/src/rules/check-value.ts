// Design notes: ./README.md#check-value

import type { StyleObject } from "../recipe/index.js";
import { homesText, referenceVerdict, type VariableHome } from "../variables/index.js";
import { Flaws } from "./flaws.js";
import { checkStepPurpose } from "./step-purpose.js";
import { VAR_REFERENCE } from "./var-reference.js";

const NESTED_AT_RULES = ["@media", "@supports", "@container"];

export function checkStyle(
  style: StyleObject,
  where: string,
  known: Set<string>,
  flaws: Flaws,
  homes: Map<string, VariableHome[]> = new Map(),
): void {
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;

    const at = `${where}.${key}`;

    if (typeof value === "object") {
      const nested = key.startsWith("&::") || NESTED_AT_RULES.some((rule) => key.startsWith(rule));

      if (!nested) {
        flaws.add(
          "free-selector",
          at,
          `nested key "${key}" is a free selector. A part, a state, and an ancestor are addressed ` +
            "by coordinate, not by selector; nesting only allows a pseudo-element (`&::…`) " +
            `and an at-rule (${NESTED_AT_RULES.join(", ")})`,
        );
        continue;
      }

      checkStyle(value, at, known, flaws, homes);
      continue;
    }

    checkValue(value, at, known, flaws, homes);
    checkStepPurpose(key, value, at, flaws, homes);
  }
}

export function checkEmpty(value: string | number, at: string, flaws: Flaws): boolean {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      flaws.add("empty-value", at, "a number is not a value");
      return false;
    }
    return false;
  }

  if (value.trim() === "") {
    flaws.add("empty-value", at, "empty value — the rule would be dead");
    return false;
  }

  return true;
}

export function checkValue(
  value: string | number,
  at: string,
  known: Set<string>,
  flaws: Flaws,
  homes: Map<string, VariableHome[]> = new Map(),
): void {
  if (!checkEmpty(value, at, flaws)) return;

  for (const [, name, fallback] of (value as string).matchAll(VAR_REFERENCE)) {
    if (fallback === ",") continue;

    const verdict = referenceVerdict(name!, known, homes);
    if (verdict.kind === "known") continue;

    if (verdict.kind === "elsewhere") {
      flaws.add(
        "variable-elsewhere",
        at,
        `variable "${name}" is declared by the passport, but on a different part — ${homesText(verdict.homes)}. ` +
          "Nobody sets it here: the rule will land on the page with an unresolved value. " +
          "Move the rule to that part, or address it through an ancestor",
      );
      continue;
    }

    flaws.add(
      "unknown-value",
      at,
      `name "${name}" is declared by neither the skin, the vocabulary, nor the passport. The ` +
        `browser will drop the whole rule, and the fix will go chasing the look. A fallback value ` +
        `— \`var(${name}, …)\` — clears the flaw`,
    );
  }
}
