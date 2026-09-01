// Design notes: ./editor.README.md

export type {
  AssemblyDataFlaw,
  ComponentFootprint,
  ComponentGroup,
  PassportComponentGenus,
  PassportEditorInfo,
  PassportEditorSpec,
  PassportGenus,
  PassportAdmission,
  PassportPartEditorInfo,
  PassportSettingEditorInfo,
  PassportSettingOptionEditorInfo,
  PassportStateEditorInfo,
  PassportVariableEditorInfo,
} from "./passport/editor/index.js";
export { admits, checkAssembly, checkAssemblyData, defineEditorInfo, footprintOf, GROUPS, groupOf } from "./passport/editor/index.js";

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
  PassportAssemblyRef,
  PassportAssemblyRepeat,
} from "./passport/assembly/index.js";
export {
  baseAssemblyOf,
  isAssemblyContent,
  isAssemblyRef,
  isAssemblyRepeat,
  isContentNode,
  isDataBinding,
  resolveDataBinding,
} from "./passport/assembly/index.js";
