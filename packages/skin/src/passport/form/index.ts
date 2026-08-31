// Design notes: ./README.md

export { createAnatomy } from "./anatomy.js";
export type { PassportAnatomy } from "./anatomy.js";

export type { PassportMark } from "./mark.js";

export type { PassportState } from "./state.js";
export { addressesView } from "./state.js";

export type { PassportVariable } from "./variable.js";

export {
  SETTINGS,
  defineSettings,
  settingApplies,
  type PassportSetting,
  type PassportSettingDependency,
  type PassportSettingName,
  type PassportSettingOption,
  type PassportSettingValues,
  type PassportSettings,
} from "./settings.js";

export type { PassportPart, PassportVariantAxis } from "./part.js";

export { definePassport, type ComponentPassport, type PassportSpec } from "./passport.js";

export type { PartOf, StatesOf, ValuesOf } from "./derive.js";
