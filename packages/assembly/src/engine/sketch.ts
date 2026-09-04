// см. README.md / FAQ.md

import { partOf } from "./passport-read.js";
import { readAddress, type Registry } from "./registry.js";
import type { AssemblyNode, AssemblyTree, NodeId } from "./tree.js";

export interface SketchNaming {
  readonly id?: NodeId;
  readonly nameOf?: (part: string, ordinal: number) => NodeId;
}

export function sketchOf(
  registry: Registry,
  component: string,
  naming: SketchNaming = {},
): AssemblyTree | undefined {
  const read = readAddress(registry, component);
  if (!read) return undefined;

  const nodes: Record<NodeId, AssemblyNode> = {};
  const taken = new Set<NodeId>();

  const nameFor = (part: string): NodeId => {
    for (let ordinal = 1; ; ordinal += 1) {
      const name = naming.nameOf
        ? naming.nameOf(part, ordinal)
        : ordinal === 1
          ? part
          : `${part}-${ordinal}`;
      if (!taken.has(name)) {
        taken.add(name);
        return name;
      }
    }
  };

  const grow = (part: string, id: NodeId, parentId: NodeId | null, path: Set<string>): void => {
    const children: NodeId[] = [];
    nodes[id] = {
      id,
      type: part === read.passport.root ? read.component : `${read.component}.${part}`,
      parentId,
      children,
    };

    const declared = partOf(read.passport, part);
    if (!declared?.accepts) return;

    const inside = new Set(path).add(part);
    for (const admission of declared.accepts) {
      if (admission.kind !== "component" || admission.name === undefined) continue;
      if (!read.passport.anatomy.keys().includes(admission.name)) continue;
      if (inside.has(admission.name)) continue;

      const childId = nameFor(admission.name);
      children.push(childId);
      grow(admission.name, childId, id, inside);
    }
  };

  const rootId = naming.id ?? read.component;
  taken.add(rootId);
  grow(read.part, rootId, null, new Set());

  return { components: { root: rootId, nodes } };
}
