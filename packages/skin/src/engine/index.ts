// Model + generation, nested form. See FAQ.md.

export * from "../model.js";

// Shadows the same-named `withPassports` from `export *` above on purpose — see FAQ.md.
export { SkinRefused, withPassports, type BoundSkin } from "./generate/index.js";

export type {
  ContrastAddress,
  ContrastNote,
  ContrastQuestion,
  ContrastReport,
  UncheckedQuestion,
  UnreckonableReason,
} from "./contrast/index.js";
export { INDISTINCT, skinContrast } from "./contrast/index.js";

export type {
  AlignPosition,
  CardToken,
  ContentDistribution,
  FlexDirection,
  LayoutGroupProps,
  LayoutSelfProps,
  LayoutToken,
  NativeStyle,
  RailToken,
  SpaceToken,
} from "./layout/index.js";
export { cardVar, layoutGroup, layoutSelf, layoutVar, railVar, spaceVar } from "./layout/index.js";
