
import { spaceVar, type SpaceToken } from "./tokens.js";
import type { AlignPosition, NativeStyle } from "./types.js";

export interface LayoutSelfProps {
  readonly grow?: boolean;
  readonly shrink?: boolean;
  readonly align?: AlignPosition;
  readonly justify?: AlignPosition;
  readonly order?: number;
  readonly basis?: SpaceToken | "auto";
}

// Место ОДНОГО элемента в чужом потоке — противоположность `layoutGroup`, которое размещает своих
// детей. Ключи выходят kebab-case: так реально пишут `style={{...}}` в этом репо (см.
// apps/skin/src/shared/ui/theme-switch), а не camelCase, как в рецептах скина — тот формат идёт
// через порождение CSS и здесь ни при чём.
export function layoutSelf(input: LayoutSelfProps): NativeStyle {
  const style: Record<string, string> = {};

  if (input.grow !== undefined) style["flex-grow"] = input.grow ? "1" : "0";
  if (input.shrink !== undefined) style["flex-shrink"] = input.shrink ? "1" : "0";
  if (input.align !== undefined) style["align-self"] = input.align;
  if (input.justify !== undefined) style["justify-self"] = input.justify;
  if (input.order !== undefined) style.order = String(input.order);
  if (input.basis !== undefined) style["flex-basis"] = input.basis === "auto" ? "auto" : spaceVar(input.basis);

  return style;
}
