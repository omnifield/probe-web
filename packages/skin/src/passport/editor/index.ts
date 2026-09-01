// Design notes: ./README.md

export type { PassportAdmission, PassportComponentGenus, PassportGenus } from "../assembly/index.js";
export { admits } from "../assembly/index.js";

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
export type { AssemblyDataFlaw } from "./check-assembly-data.js";
