
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
  PassportAssemblyNode,
  PassportAssemblyRepeat,
  PassportSelfAssembly,
} from "./nodes.js";
export { isAssemblyContent, isAssemblyRepeat } from "./nodes.js";

export type { DataPreset, PassportAssembly } from "./assembly.js";

export type {
  AssemblyContent as BaseAssemblyContent,
  AssemblyElement as BaseAssemblyElement,
  AssemblyNode as BaseAssemblyNode,
  AssemblyTree as BaseAssemblyTree,
} from "@web-core/assembly";
export { isContent as isContentNode } from "@web-core/assembly";

export { baseAssemblyOf, scopedPath } from "./expand.js";
