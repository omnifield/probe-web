// ЦЕЛОСТНОСТЬ дерева — противоречия внутри самих данных.
//
// Это НЕ проверка вложенности: та спрашивает паспорт «допустимо ли класть это сюда», а здесь
// вопрос к дереву о нём самом — есть ли корень, сходятся ли ссылки, не потерялся ли узел.
// Предметы разные, поэтому и модули разные: дерево может быть целым и при этом собранным не
// по правилам, и наоборот.
//
// Форма перенесена из прежней отрисовки, где те же проверки жили внутри неё и писали
// предупреждения в консоль. При переносе они вынуты наружу и стали ЗНАЧЕНИЕМ: консоль читает
// человек в момент запуска, а редактору нужно показать изъян в своём окне, хранилищу —
// отказаться сохранить, пробе — проверить именно тот изъян, ради которого она написана.
// Отрисовка эти же проверки зовёт для трассы (см. `render.tsx`).
//
// Именование отказов взято у чужой механики того же предмета (`@json-render/*`: `missing_root`,
// `orphaned_element`, `missing_child`; сверено 2026-08-20): совпадение словаря даром, а
// расхождение стоило бы перевода в каждом месте, где деревья ходят между инструментами.

import { nodeOf, type AssemblyTree, type NodeId } from "./tree.js";

/**
 * Имя изъяна:
 *
 *  • `root-missing`     — корень назван, но такого узла в карте нет: рисовать нечего;
 *  • `id-mismatch`      — узел лежит под одним ключом, а зовётся другим: взятие по имени
 *                          разойдётся с обходом карты;
 *  • `child-missing`    — узел ссылается на ребёнка, которого нет;
 *  • `child-duplicated` — один и тот же ребёнок назван дважды: отрисовка покажет его дважды;
 *  • `parent-mismatch`  — обратная ссылка не совпадает с прямой; подъём по дереву соврёт;
 *  • `child-shared`     — один узел числится ребёнком у двоих: дерево перестало быть деревом;
 *  • `orphaned`         — узел есть в карте, но от корня недостижим: он не нарисуется никогда;
 *  • `cycle`            — узел лежит в собственном поддереве: обход не кончится.
 */
export type TreeFlawName =
  | "root-missing"
  | "id-mismatch"
  | "child-missing"
  | "child-duplicated"
  | "parent-mismatch"
  | "child-shared"
  | "orphaned"
  | "cycle";

/** Один изъян: имя, к чему относится и что это значит человеку. */
export interface TreeFlaw {
  readonly flaw: TreeFlawName;
  /** Узел, о котором речь. */
  readonly nodeId: NodeId;
  /** Второй участник — ребёнок или владелец, если изъян про связь. */
  readonly relatedId?: NodeId;
  /** Что это значит человеку и редактору. */
  readonly means: string;
}

/**
 * Ищет противоречия в дереве. Пустой ответ — дерево целое.
 *
 * Возвращаются ВСЕ найденные изъяны, а не первый: чинить дерево по одному изъяну за проход —
 * это столько же проходов, сколько изъянов, и редактор не сможет показать человеку, что
 * именно не так, целиком.
 *
 * Пустое дерево (ни одного узла) изъяном не считается: это законный первый кадр — данные ещё
 * не пришли, — и объявлять его сломанным значило бы кричать на каждом запуске.
 *
 * @param tree дерево
 */
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

  // Кто уже назван чьим-то ребёнком: так ловится и второй владелец, и сирота.
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

  // Достижимость от корня — спуском в глубину, с памятью о ТЕКУЩЕМ пути.
  //
  // Путь, а не просто «уже видели»: узел, встреченный второй раз вне своего пути, — это ромб
  // (двое назвали одного ребёнком), и он уже назван изъяном `child-shared` выше. Кольцо —
  // другое: узел лежит на пути в самого себя, и только по этому признаку его и отличить.
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
