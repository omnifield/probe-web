// Design notes: ./README.md#variant

import type { ComponentPassport } from "../passport/form/index.js";
import { attribute } from "./scope.js";

export function anyOf(options: readonly string[] | undefined): string | undefined {
  if (options === undefined) return undefined;
  if (options.length === 0) return "";

  return options.length === 1 ? options[0]! : `:is(${options.join(", ")})`;
}

export function variantAlternatives(passport: ComponentPassport, variant: string, isDefault: boolean): string[] | undefined {
  const mark = passport.variantAxis.mark;
  if (mark.kind !== "attribute") return undefined;

  const named = attribute(mark.name, variant);

  return isDefault ? [named, `:not([${mark.name}])`] : [named];
}

export function variantSelector(passport: ComponentPassport, variant: string, isDefault: boolean): string | undefined {
  return anyOf(variantAlternatives(passport, variant, isDefault));
}

export function noWeight(selector: string): string {
  return selector === "" ? "" : `:where(${selector})`;
}
