// см. README.md / FAQ.md

import type { DispatchAction, DynamicValue } from "./tree.js";
import type { Genus } from "./passport-read.js";
import type { AssemblyContent, AssemblyElement, AssemblyTree, NodeId } from "./tree.js";

export interface SelfAssemblyContent {
  readonly genus: Genus;
  readonly value: DynamicValue;
}

export interface SelfAssemblyElement {
  readonly node: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  readonly children?: readonly SelfAssemblyNode[];
}

export type SelfAssemblyNode = SelfAssemblyElement | SelfAssemblyContent;

export interface SelfAssembly {
  readonly tree: SelfAssemblyElement;
}

const isSelfAssemblyContent = (node: SelfAssemblyNode): node is SelfAssemblyContent => "genus" in node;

export function growSelfAssembly(assembly: SelfAssembly, address: string, rootPart: string): AssemblyTree {
  const nodes: Record<NodeId, AssemblyElement | AssemblyContent> = {};
  let contentSerial = 0;

  const grow = (node: SelfAssemblyNode, parentId: NodeId | null): NodeId => {
    if (isSelfAssemblyContent(node)) {
      const id = `${parentId}.content-${contentSerial++}`;
      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };
      return id;
    }

    const isRoot = node.node === rootPart;
    const id = isRoot ? address : `${address}.${node.node}`;
    const children = (node.children ?? []).map((child) => grow(child, id));

    nodes[id] = {
      id,
      type: id,
      parentId,
      children,
      ...(node.props ? { props: node.props } : {}),
      ...(node.bind ? { bind: node.bind } : {}),
      ...(node.on ? { on: node.on } : {}),
    };

    return id;
  };

  const root = grow(assembly.tree, null);

  return { components: { root, nodes } };
}
