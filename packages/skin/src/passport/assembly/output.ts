// Design notes: ./README.md#output

import type { PassportGenus } from "./admission.js";
import type { DispatchAction, DynamicValue } from "./binding.js";

export interface BaseAssemblyElement {
  readonly id: string;
  readonly type: string;
  readonly parentId: string | null;
  readonly children: readonly string[];
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
}

export interface BaseAssemblyContent {
  readonly id: string;
  readonly genus: PassportGenus;
  readonly value: DynamicValue;
  readonly parentId: string | null;
  readonly children: readonly [];
}

export type BaseAssemblyNode = BaseAssemblyElement | BaseAssemblyContent;

export function isContentNode(node: BaseAssemblyNode): node is BaseAssemblyContent {
  return "genus" in node;
}

export interface BaseAssemblyTree {
  readonly components: {
    readonly root: string;
    readonly nodes: Readonly<Record<string, BaseAssemblyNode>>;
    readonly providerProps?: Readonly<Record<string, unknown>>;
  };
}
