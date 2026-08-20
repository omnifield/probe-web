// ПРАВКИ дерева — четыре операции, которыми редактор его меняет.
//
// ## Правки чистые, и это не стилистика
//
// Каждая возвращает НОВОЕ дерево, не трогая прежнее. Причина в потребителе: дерево живёт в
// сигнале, отмена правки — это возврат к прежнему значению, а сравнение «изменилось ли»
// делается по ссылке. Правь мы дерево на месте, отмена стоила бы копии всего дерева на каждый
// шаг, а сравнение по ссылке молча перестало бы работать.
//
// ## Отказ — значение, а не исключение
//
// Недопустимая правка это НОРМАЛЬНЫЙ ход событий: человек тянет узел туда, куда нельзя, и
// редактор обязан сказать почему. Исключение здесь означало бы, что каждое перетаскивание
// оборачивают в перехват, а причина отказа теряется по дороге к человеку.
//
// ## Одна правка — один узел
//
// Вставляется ровно один узел, без поддерева. Составное собирается последовательностью
// правок, и каждая проверяется отдельно. Приведи мы сюда вставку поддерева целиком — на
// первом же отказе посреди него пришлось бы решать, что делать с уже вставленным, а это
// решение принадлежит редактору, а не механике.

import { canContain, type NestingRefusal } from "./nesting.js";
import type { Registry } from "./registry.js";
import { nodeOf, subtreeOf, type AssemblyNode, type AssemblyTree, type NodeId } from "./tree.js";

/**
 * Имя отказа правке. Отказы вложенности приходят сюда как есть — своих имён для того же
 * события механика не заводит, иначе редактору пришлось бы знать два словаря вместо одного.
 *
 *  • `node-unknown`      — узла, который правят, в дереве нет;
 *  • `parent-unknown`    — узла-владельца в дереве нет;
 *  • `id-taken`          — имя уже занято: два узла под одним именем это потерянный узел;
 *  • `root-locked`       — корень дерева не переносится и не удаляется: без него дерева нет;
 *  • `into-own-subtree`  — узел переносят внутрь самого себя.
 */
export type EditRefusal =
  | "node-unknown"
  | "parent-unknown"
  | "id-taken"
  | "root-locked"
  | "into-own-subtree"
  | NestingRefusal;

/** Ответ правки: новое дерево, либо отказ с именем и пояснением человеку. */
export type EditResult =
  | { readonly ok: true; readonly tree: AssemblyTree }
  | { readonly ok: false; readonly refusal: EditRefusal; readonly means: string };

/** Что объявляет вставляемый узел. Связи (`parentId`, `children`) проставляет сама правка. */
export interface NewNode {
  readonly id: NodeId;
  /** Адрес в реестре через точку. */
  readonly type: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly meta?: Readonly<Record<string, unknown>>;
  readonly styles?: Readonly<Record<string, string>>;
}

const refuse = (refusal: EditRefusal, means: string): EditResult => ({
  ok: false,
  refusal,
  means,
});

const withNodes = (
  tree: AssemblyTree,
  nodes: Record<NodeId, AssemblyNode>,
): AssemblyTree => ({ components: { root: tree.components.root, nodes } });

/**
 * Кладёт `id` в детей `owner` на место `index`.
 *
 * Место за пределами перечня прижимается к его краю: редактор считает позицию по указателю
 * человека, и «на один дальше конца» там обычное дело. Отказывать в этом значило бы требовать
 * от каждого потребителя собственного прижатия — одного и того же, написанного заново.
 */
const insertAt = (children: readonly NodeId[], id: NodeId, index?: number): NodeId[] => {
  const next = [...children];
  const place = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
  next.splice(place, 0, id);
  return next;
};

/**
 * Вставляет новый узел внутрь владельца.
 *
 * @param tree дерево
 * @param registry реестр — источник правил вложенности
 * @param node что вставляем
 * @param parentId владелец
 * @param index место среди детей; без него — в конец
 */
export function insertNode(
  tree: AssemblyTree,
  registry: Registry,
  node: NewNode,
  parentId: NodeId,
  index?: number,
): EditResult {
  const owner = nodeOf(tree, parentId);
  if (!owner) {
    return refuse("parent-unknown", `узла «${parentId}» в дереве нет — вкладывать некуда`);
  }
  if (nodeOf(tree, node.id)) {
    return refuse("id-taken", `имя «${node.id}» в дереве уже занято`);
  }

  const verdict = canContain(registry, owner.type, node.type);
  if (!verdict.allowed) return refuse(verdict.refusal, verdict.means);

  const added: AssemblyNode = {
    id: node.id,
    type: node.type,
    parentId,
    children: [],
    ...(node.props ? { props: node.props } : {}),
    ...(node.meta ? { meta: node.meta } : {}),
    ...(node.styles ? { styles: node.styles } : {}),
  };

  const nodes = { ...tree.components.nodes };
  nodes[node.id] = added;
  nodes[parentId] = { ...owner, children: insertAt(owner.children, node.id, index) };

  return { ok: true, tree: withNodes(tree, nodes) };
}

/**
 * Убирает узел вместе со всем, что под ним.
 *
 * Поддерево уходит целиком, потому что иначе его узлы остались бы в карте недостижимыми —
 * ровно тот изъян, который ловит `checkTree` под именем `orphaned`. Механика не оставляет
 * после себя того, что сама же назовёт сломанным.
 *
 * @param tree дерево
 * @param id узел
 */
export function removeNode(tree: AssemblyTree, id: NodeId): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);
  if (id === tree.components.root) {
    return refuse("root-locked", `«${id}» — корень дерева: без него дерева не останется`);
  }

  const nodes = { ...tree.components.nodes };
  for (const gone of subtreeOf(tree, id)) delete nodes[gone];

  const ownerId = node.parentId;
  if (ownerId !== null) {
    const owner = nodes[ownerId];
    if (owner) {
      nodes[ownerId] = { ...owner, children: owner.children.filter((child) => child !== id) };
    }
  }

  return { ok: true, tree: withNodes(tree, nodes) };
}

/**
 * Переносит узел к другому владельцу (или на другое место у того же).
 *
 * @param tree дерево
 * @param registry реестр — источник правил вложенности
 * @param id что переносим
 * @param parentId новый владелец
 * @param index место среди его детей; без него — в конец
 */
export function moveNode(
  tree: AssemblyTree,
  registry: Registry,
  id: NodeId,
  parentId: NodeId,
  index?: number,
): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);
  if (id === tree.components.root) {
    return refuse("root-locked", `«${id}» — корень дерева: переносить его некуда`);
  }

  const owner = nodeOf(tree, parentId);
  if (!owner) return refuse("parent-unknown", `узла «${parentId}» в дереве нет — переносить некуда`);

  // Проверка идёт по поддереву, а не по одному лишь совпадению имён: узел внутрь самого себя
  // редактор двигает редко, а внутрь собственного потомка — постоянно, и оба случая уносят
  // поддерево из дерева одинаково.
  if (subtreeOf(tree, id).includes(parentId)) {
    return refuse(
      "into-own-subtree",
      `«${parentId}» лежит внутри «${id}» — узел нельзя положить в самого себя`,
    );
  }

  const verdict = canContain(registry, owner.type, node.type);
  if (!verdict.allowed) return refuse(verdict.refusal, verdict.means);

  const nodes = { ...tree.components.nodes };

  const previousId = node.parentId;
  if (previousId !== null) {
    const previous = nodes[previousId];
    if (previous) {
      nodes[previousId] = {
        ...previous,
        children: previous.children.filter((child) => child !== id),
      };
    }
  }

  // Владельца перечитываем из уже поправленной карты: при переносе внутри одного владельца
  // прежний снимок держит узел на старом месте, и он вернулся бы вторым вхождением.
  const target = nodes[parentId] as AssemblyNode;
  nodes[parentId] = { ...target, children: insertAt(target.children, id, index) };
  nodes[id] = { ...node, parentId };

  return { ok: true, tree: withNodes(tree, nodes) };
}

/** Что меняем у узла. Названное поле заменяется целиком, неназванное остаётся как было. */
export interface NodePatch {
  readonly props?: Readonly<Record<string, unknown>>;
  readonly meta?: Readonly<Record<string, unknown>>;
  readonly styles?: Readonly<Record<string, string>>;
}

/**
 * Меняет пропы, редакторское или вид узла.
 *
 * Названное поле заменяется ЦЕЛИКОМ, а не сливается по ключам. Слияние выглядит удобнее ровно
 * до первой попытки убрать один проп: убрать его стало бы нечем, и потребителю пришлось бы
 * заводить своё соглашение об «удаляющем значении» — то есть второе правило поверх нашего.
 *
 * Адрес узла (`type`) здесь не меняется: смена адреса — это другой компонент, а значит другая
 * вложенность и другие части. Такое делается парой «убрать и вставить», где обе половины
 * проверяются.
 *
 * @param tree дерево
 * @param id узел
 * @param patch что заменить
 */
export function updateNode(tree: AssemblyTree, id: NodeId, patch: NodePatch): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);

  const nodes = { ...tree.components.nodes };
  nodes[id] = {
    ...node,
    ...("props" in patch ? { props: patch.props } : {}),
    ...("meta" in patch ? { meta: patch.meta } : {}),
    ...("styles" in patch ? { styles: patch.styles } : {}),
  };

  return { ok: true, tree: withNodes(tree, nodes) };
}
