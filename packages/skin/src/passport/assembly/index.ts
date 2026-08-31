// Design notes: ./README.md

export type {
  PassportAdmission,
  PassportComponentGenus,
  PassportGenus,
  PassportPartAdmission,
} from "./admission.js";
export { admits } from "./admission.js";

export type { DataBinding, DispatchAction, DynamicValue } from "./binding.js";
export { isDataBinding, resolveDataBinding } from "./binding.js";

export type {
  PassportAssemblyContent,
  PassportAssemblyElement,
  PassportAssemblyExtra,
  PassportAssemblyNode,
  PassportAssemblyRef,
  PassportAssemblyRepeat,
  PassportSelfAssembly,
} from "./nodes.js";
export { isAssemblyContent, isAssemblyExtra, isAssemblyRef, isAssemblyRepeat } from "./nodes.js";

export type { DataPreset, PassportAssembly } from "./assembly.js";

export type { BaseAssemblyContent, BaseAssemblyElement, BaseAssemblyNode, BaseAssemblyTree } from "./output.js";
export { isContentNode } from "./output.js";

export { baseAssemblyOf, scopedPath } from "./expand.js";
