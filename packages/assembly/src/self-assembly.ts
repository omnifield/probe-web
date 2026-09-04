// A component's OWN behavior (`PWEB-167`/`PWEB-169`) — how it assembles itself from props, as
// opposed to the tree a reference from someone else's assembly declares FOR it.
//
// Deliberately its own narrow declaration, not an import of `@web-core/skin`'s
// `PassportAssemblyElement`/`PassportAssemblyContent`: the mechanic never depends on the skin
// package at runtime (only as a dev-only, type-only reference — see `passport-read.ts`'s header
// for why), and a self-assembly tree is read here at RENDER time, in real application code, not
// only in an editor. Same reasoning as `ReadablePassport` itself: the narrowest record of what
// this package actually needs, kept in sync with the real form by the reader's own test, not by
// a shared import.
//
// `node` — own part name or a bare reference to another registry component, ONE field, mirroring
// the skin's own merge (`PassportAssemblyElement`, `PWEB-172`): the two used to be different
// fields for the same relationship, and the mechanic's copy of the shape stays symmetric with the
// declaring side, not a fossil of the split it outgrew.
//
// NARROWER than the skin's full node vocabulary on purpose: no `repeat`, no named `ref`. Every
// self-assembly declared today (the button's) is a root part with plain content children and an
// optional `on` — this grows the day one actually needs more, not ahead of it.

import type { DispatchAction, DynamicValue } from "./tree.js";
import type { Genus } from "./passport-read.js";
import type { AssemblyContent, AssemblyElement, AssemblyTree, NodeId } from "./tree.js";

/** A leaf: a label or similar value named by its genus — same shape as `AssemblyContent`. */
export interface SelfAssemblyContent {
  readonly genus: Genus;
  readonly value: DynamicValue;
}

/** Own anatomy part, or a bare reference to another component of the shared registry — same field. */
export interface SelfAssemblyElement {
  readonly node: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  readonly children?: readonly SelfAssemblyNode[];
}

export type SelfAssemblyNode = SelfAssemblyElement | SelfAssemblyContent;

/** The component's own behavior, root-first — the runtime slice, no `name`/`means`. */
export interface SelfAssembly {
  readonly tree: SelfAssemblyElement;
}

const isSelfAssemblyContent = (node: SelfAssemblyNode): node is SelfAssemblyContent => "genus" in node;

/**
 * Unfolds a component's own behavior into the same flat shape the mechanic renders anywhere
 * else — a small, self-contained `AssemblyTree` rooted at `address`, ready for a nested
 * `RenderTree` (`render.tsx`'s `RenderNode`, `PWEB-169`).
 *
 * @param assembly the component's own `selfAssembly`
 * @param address where the component's root actually lives in the registry (`button`, `ui.button`)
 * @param rootPart the component's own root part name (`ReadablePassport.root`) — needed to tell
 *   the tree's top from a nested part of the SAME component, the same distinction
 *   `baseAssemblyOf`'s `addressOf` makes on the declaring side
 */
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
