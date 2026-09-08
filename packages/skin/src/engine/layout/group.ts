
import { spaceVar, type SpaceToken } from "./tokens.js";
import type { AlignPosition, ContentDistribution, FlexDirection, NativeStyle } from "./types.js";

export interface LayoutGroupProps {
  readonly align?: AlignPosition;
  readonly justify?: ContentDistribution;
  readonly gap?: SpaceToken;
  readonly direction?: FlexDirection;
  readonly wrap?: boolean;
}

// Управление СВОИМИ детьми — целенаправленная ручная стилизация root-вида, а не факт места одного
// элемента (`layoutSelf`). Имя то же (`align`/`justify`), но точка входа решает, в какое CSS-свойство
// оно ляжет: align-items/justify-content здесь, align-self/justify-self — там. Смешивать оба смысла
// в одном плоском объекте намеренно не стали — это и была бы та самая тихая неоднозначность.
export function layoutGroup(input: LayoutGroupProps): NativeStyle {
  const style: Record<string, string> = {};

  if (input.align !== undefined) style["align-items"] = input.align;
  if (input.justify !== undefined) style["justify-content"] = input.justify;
  if (input.gap !== undefined) style.gap = spaceVar(input.gap);
  if (input.direction !== undefined) style["flex-direction"] = input.direction;
  if (input.wrap !== undefined) style["flex-wrap"] = input.wrap ? "wrap" : "nowrap";

  return style;
}
