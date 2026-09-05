export type {
  PassportAdmission,
  PassportComponentGenus,
  PassportGenus,
} from "../engine/passport/assembly/index.js";
export { admits } from "../engine/passport/assembly/index.js";

export { GROUPS, footprintOf, groupOf } from "./groups.js";
export type { ComponentFootprint, ComponentGroup } from "./groups.js";

export type {
  PassportEditorInfo,
  PassportEditorSpec,
  PassportPartEditorInfo,
  PassportSettingEditorInfo,
  PassportSettingOptionEditorInfo,
  PassportStateEditorInfo,
  PassportVariableEditorInfo,
} from "./types.js";

export { defineEditorInfo } from "./define.js";
export { checkAssembly } from "./check-assembly.js";
export { checkAssemblyData } from "./check-assembly-data.js";

export type {
  BaseAssemblyContent,
  BaseAssemblyElement,
  BaseAssemblyNode,
  BaseAssemblyTree,
  DataBinding,
  DataPreset,
  DispatchAction,
  DynamicValue,
  PassportAssembly,
  PassportAssemblyContent,
  PassportAssemblyElement,
  PassportAssemblyNode,
  PassportAssemblyRepeat,
} from "../engine/passport/assembly/index.js";
export {
  baseAssemblyOf,
  isAssemblyContent,
  isAssemblyRepeat,
  isContentNode,
  isDataBinding,
  resolveDataBinding,
} from "../engine/passport/assembly/index.js";
