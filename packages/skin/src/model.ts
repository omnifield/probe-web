// Design notes: ./model.README.md

export type {
  AncestorStyle,
  CompoundVariant,
  ScaleDeclaration,
  SeededScale,
  Keyframes,
  LocalStyle,
  PartStyle,
  PartStyles,
  Skin,
  SketchEdit,
  SkinVariables,
  SlotRecipe,
  StyleObject,
  StyleValue,
} from "./recipe/index.js";

export {
  DARK_CLASS,
  FORCE_ATTRIBUTE,
  LAYER_ORDER,
  NODE_ATTRIBUTE,
  SKETCH_LAYER,
  SKIN_LAYER,
} from "./marks/index.js";

export type {
  ComponentPassport,
  PassportAnatomy,
  PassportMark,
  PassportPart,
  PassportSetting,
  PassportSettingDependency,
  PassportSettingName,
  PassportSettingOption,
  PassportSettings,
  PassportSettingValues,
  PassportSpec,
  PassportState,
  PassportVariable,
  PassportVariantAxis,
} from "./passport/form/index.js";
export {
  addressesView,
  createAnatomy,
  defineSettings,
  definePassport,
  SETTINGS,
  settingApplies,
} from "./passport/form/index.js";

export type { SkinAncestor, SkinCoordinate } from "./passport-view/index.js";
export { coordinateOf, partOf } from "./passport-view/index.js";

export type {
  DataBinding,
  DispatchAction,
  DynamicValue,
  PassportAssemblyContent,
  PassportAssemblyElement,
  PassportAssemblyNode,
  PassportAssemblyRepeat,
  PassportGenus,
  PassportSelfAssembly,
} from "./passport/assembly/index.js";
export {
  isAssemblyContent,
  isAssemblyRepeat,
  isDataBinding,
  resolveDataBinding,
} from "./passport/assembly/index.js";

export type { PassportLookup } from "./address/index.js";
export {
  ancestorSelector,
  markSelector,
  nodeSelector,
  componentSelector,
  partSelector,
  passportLookup,
  safeName,
  stateSelector,
  variantSelector,
} from "./address/index.js";

export type {
  CssRule,
  RuleCoordinate,
  SkinFlaw,
  SkinFlawName,
  SkinRule,
  SkinRules,
  SketchRules,
  ValueVocabulary,
} from "./rules/index.js";

export type { BoundModel } from "./bound/index.js";
export { withPassports } from "./bound/index.js";

export type { SkinGap, SkinGapKind } from "./coverage/index.js";
export { skinGaps } from "./coverage/index.js";

export { isMotion, MOTION_FAMILIES } from "./motion/index.js";

export type { SkinHalf, SkinValue, ValueOrigin } from "./seeds/index.js";
export { NOT_SEEDED, skinValues, valueNames } from "./seeds/index.js";
export type { SizeRefusal, SizeSeed } from "./sizes/index.js";
export { SIZE_SEEDS, sizeRefusals, sizeValues } from "./sizes/index.js";

export type {
  DimensionSeed,
  FluidBarKind,
  FluidPole,
  FluidRefusal,
  FluidReport,
  FluidSeed,
} from "./fluid/index.js";
export { fluidBar, fluidExpression, fluidPoles, fluidRefusals, isFluid } from "./fluid/index.js";

export type {
  Assembled,
  ComponentAssembly,
  Form,
  LookParts,
  Outfit,
  OutfitFlaw,
  OutfitFlawName,
  OutfitReport,
  Palette,
} from "./look/index.js";
export { OutfitRefused } from "./look/index.js";

export type { Role, RoleKind } from "./vocabulary/index.js";
export { knownRole, ROLE_NAMES, SCALE_ROLES, VOCABULARY } from "./vocabulary/index.js";
