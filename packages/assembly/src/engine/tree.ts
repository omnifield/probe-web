// см. README.md / FAQ.md

import { getValueByPointer } from "fast-json-patch";

import type { Genus } from "./passport-read.js";

export type NodeId = string;

export interface AssemblyElement {
  readonly id: NodeId;
  readonly type: string;
  readonly composedInto?: string;
  readonly parentId: NodeId | null;
  readonly children: readonly NodeId[];
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface DispatchAction {
  readonly event: {
    readonly name: string;
    readonly context?: Readonly<Record<string, DynamicValue>>;
  };
}

export interface DispatchedEvent {
  readonly name: string;
  readonly nodeId: NodeId;
  readonly address: string;
  readonly timestamp: string;
  readonly context: Readonly<Record<string, unknown>>;
}

export interface DataBinding {
  readonly path: string;
}

export type DynamicValue = string | DataBinding;

export function isDataBinding(value: DynamicValue): value is DataBinding {
  return typeof value === "object" && value !== null && "path" in value;
}

export function resolveDataBinding(data: unknown, path: string): unknown {
  if (path === "") return data;

  try {
    return getValueByPointer(data, path);
  } catch {
    return undefined;
  }
}

export interface AssemblyContent {
  readonly id: NodeId;
  readonly genus: Genus;
  readonly value: DynamicValue;
  readonly parentId: NodeId | null;
  readonly children: readonly [];
  readonly meta?: Readonly<Record<string, unknown>>;
}

export type AssemblyNode = AssemblyElement | AssemblyContent;

export function isContent(node: AssemblyNode): node is AssemblyContent {
  return "genus" in node;
}

export function outerTypeOf(node: AssemblyNode): string | undefined {
  return isContent(node) ? undefined : (node.composedInto ?? node.type);
}

export interface AssemblyTree {
  readonly components: {
    readonly root: NodeId;
    readonly nodes: Readonly<Record<NodeId, AssemblyNode>>;
    readonly providerProps?: Readonly<Record<string, unknown>>;
  };
}

export const EMPTY_TREE: AssemblyTree = { components: { root: "", nodes: {} } };

export function nodeOf(tree: AssemblyTree, id: NodeId): AssemblyNode | undefined {
  return tree.components.nodes[id];
}

export function rootOf(tree: AssemblyTree): AssemblyNode | undefined {
  return tree.components.nodes[tree.components.root];
}

export function ancestorsOf(tree: AssemblyTree, id: NodeId): AssemblyNode[] {
  const chain: AssemblyNode[] = [];
  const seen = new Set<NodeId>([id]);

  let current = nodeOf(tree, id)?.parentId ?? null;
  while (current !== null && !seen.has(current)) {
    const owner = nodeOf(tree, current);
    if (!owner) break;
    chain.push(owner);
    seen.add(current);
    current = owner.parentId;
  }

  return chain;
}

export function subtreeOf(tree: AssemblyTree, id: NodeId): NodeId[] {
  const collected: NodeId[] = [];
  const seen = new Set<NodeId>();
  const queue: NodeId[] = [id];

  while (queue.length > 0) {
    const current = queue.shift() as NodeId;
    if (seen.has(current)) continue;
    seen.add(current);

    const node = nodeOf(tree, current);
    if (!node) continue;
    collected.push(current);
    queue.push(...node.children);
  }

  return collected;
}
