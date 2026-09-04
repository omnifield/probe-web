// см. README.md / FAQ.md

import { isContent, nodeOf, type AssemblyTree, type NodeId } from "./tree.js";

export type TreeFlawName =
  | "root-missing"
  | "id-mismatch"
  | "child-missing"
  | "child-duplicated"
  | "parent-mismatch"
  | "child-shared"
  | "orphaned"
  | "cycle"
  | "content-in-props"
  | "content-with-children";

export interface TreeFlaw {
  readonly flaw: TreeFlawName;
  readonly nodeId: NodeId;
  readonly relatedId?: NodeId;
  readonly means: string;
}

export function checkTree(tree: AssemblyTree): TreeFlaw[] {
  const { root, nodes } = tree.components;
  const flaws: TreeFlaw[] = [];
  const keys = Object.keys(nodes);
  if (keys.length === 0) return flaws;

  if (!(root in nodes)) {
    flaws.push({
      flaw: "root-missing",
      nodeId: root,
      means: `корнем назван «${root}», но такого узла в дереве нет — рисовать нечего`,
    });
  }

  const claimedBy = new Map<NodeId, NodeId>();

  for (const key of keys) {
    const node = nodes[key] as (typeof nodes)[string];

    if (node.id !== key) {
      flaws.push({
        flaw: "id-mismatch",
        nodeId: key,
        relatedId: node.id,
        means: `узел лежит под ключом «${key}», а зовётся «${node.id}» — взятие по имени идёт по ключу`,
      });
    }

    if (isContent(node)) {
      if ((node.children as readonly NodeId[]).length > 0) {
        flaws.push({
          flaw: "content-with-children",
          nodeId: key,
          means: `узел «${key}» — содержимое рода «${node.genus}», но у него есть дети: внутрь содержимого не кладётся ничего`,
        });
      }
    } else if (node.props && "children" in node.props) {
      flaws.push({
        flaw: "content-in-props",
        nodeId: key,
        means: `узел «${key}» несёт содержимое пропом «children» — это прежняя форма: содержимое кладётся ОТДЕЛЬНЫМ узлом среди детей, и пропом отрисовка его не покажет`,
      });
    }

    const seen = new Set<NodeId>();
    for (const childId of node.children) {
      if (seen.has(childId)) {
        flaws.push({
          flaw: "child-duplicated",
          nodeId: key,
          relatedId: childId,
          means: `ребёнок «${childId}» назван у «${key}» дважды — он и нарисуется дважды`,
        });
        continue;
      }
      seen.add(childId);

      const child = nodeOf(tree, childId);
      if (!child) {
        flaws.push({
          flaw: "child-missing",
          nodeId: key,
          relatedId: childId,
          means: `узел «${key}» ссылается на ребёнка «${childId}», которого в дереве нет`,
        });
        continue;
      }

      const owner = claimedBy.get(childId);
      if (owner !== undefined) {
        flaws.push({
          flaw: "child-shared",
          nodeId: childId,
          relatedId: key,
          means: `узел «${childId}» числится ребёнком и у «${owner}», и у «${key}» — дерево перестало быть деревом`,
        });
      } else {
        claimedBy.set(childId, key);
      }

      if (child.parentId !== key) {
        flaws.push({
          flaw: "parent-mismatch",
          nodeId: childId,
          relatedId: key,
          means: `узел «${childId}» лежит в детях «${key}», а владельцем зовёт «${child.parentId}» — подъём по дереву соврёт`,
        });
      }
    }
  }

  const reached = new Set<NodeId>();
  if (root in nodes) {
    const path = new Set<NodeId>();
    const walk = (id: NodeId) => {
      if (path.has(id)) {
        flaws.push({
          flaw: "cycle",
          nodeId: id,
          means: `узел «${id}» лежит в собственном поддереве — обход по такому дереву не кончится`,
        });
        return;
      }
      if (reached.has(id)) return;
      reached.add(id);

      const node = nodeOf(tree, id);
      if (!node) return;
      path.add(id);
      for (const childId of node.children) walk(childId);
      path.delete(id);
    };
    walk(root);
  }

  for (const key of keys) {
    if (reached.has(key)) continue;
    flaws.push({
      flaw: "orphaned",
      nodeId: key,
      means: `узел «${key}» есть в дереве, но от корня недостижим — он не нарисуется никогда`,
    });
  }

  return flaws;
}
