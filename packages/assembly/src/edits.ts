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

import { canAdmit, canContain, type NestingRefusal } from "./nesting.js";
import type { Genus } from "./passport-read.js";
import type { Registry } from "./registry.js";
import {
  isContent,
  nodeOf,
  subtreeOf,
  type AssemblyContent,
  type AssemblyElement,
  type AssemblyNode,
  type AssemblyTree,
  type NodeId,
} from "./tree.js";

/**
 * Имя отказа правке. Отказы вложенности приходят сюда как есть — своих имён для того же
 * события механика не заводит, иначе редактору пришлось бы знать два словаря вместо одного.
 *
 *  • `node-unknown`           — узла, который правят, в дереве нет;
 *  • `parent-unknown`         — узла-владельца в дереве нет;
 *  • `id-taken`               — имя уже занято: два узла под одним именем это потерянный узел;
 *  • `root-locked`            — корень дерева не переносится и не удаляется: без него дерева нет;
 *  • `into-own-subtree`       — узел переносят внутрь самого себя;
 *  • `content-holds-nothing`  — кладут ВНУТРЬ узла содержимого: подпись это лист, внутрь неё
 *                                не кладётся ничего, и паспорта, который бы это разрешил, нет;
 *  • `patch-not-of-node`      — правят поле не того рода: пропы у узла содержимого, значение у
 *                                узла компонента.
 */
export type EditRefusal =
  | "node-unknown"
  | "parent-unknown"
  | "id-taken"
  | "root-locked"
  | "into-own-subtree"
  | "content-holds-nothing"
  | "patch-not-of-node"
  | NestingRefusal;

/** Ответ правки: новое дерево, либо отказ с именем и пояснением человеку. */
export type EditResult =
  | { readonly ok: true; readonly tree: AssemblyTree }
  | { readonly ok: false; readonly refusal: EditRefusal; readonly means: string };

/** Что объявляет вставляемый узел компонента. Связи (`parentId`, `children`) ставит сама правка. */
export interface NewElement {
  readonly id: NodeId;
  /** Адрес в реестре через точку — внутренний компонент, тот, чем вещь является визуально. */
  readonly type: string;
  /**
   * Во что узел вставлен — адрес внешнего компонента, если это композиция (`PWEB-33`).
   *
   * Проверяется вместе с местом: внешний обязан пускать внутрь внутренний, а владелец —
   * пускать внутрь внешний.
   */
  readonly composedInto?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Что объявляет вставляемый узел содержимого (`PWEB-83`).
 *
 * Вставляется ТЕМ ЖЕ `insertNode`, что и часть, и проверяется тем же правилом допуска — просто
 * кандидатом другого вида: `{ kind: "content", genus }` вместо адреса. Второй правки под
 * содержимое не заводится: было бы два способа положить узел в один и тот же список детей.
 */
export interface NewContent {
  readonly id: NodeId;
  /** Род содержимого — его называет паспорт, механика передаёт его правилу допуска как есть. */
  readonly genus: Genus;
  /** Значение — то, что видно человеку. */
  readonly value: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Что вставляют: узел компонента либо узел содержимого. */
export type NewNode = NewElement | NewContent;

/** Содержимое ли это объявлено — по наличию рода, как и у самого узла (`isContent`). */
const isContentSpec = (node: NewNode): node is NewContent => "genus" in node;

const refuse = (refusal: EditRefusal, means: string): EditResult => ({
  ok: false,
  refusal,
  means,
});

/** Что кладут — ровно то, чем размещение проверяется: род содержимого либо пара адресов. */
type Placed =
  | { readonly genus: Genus }
  | { readonly type: string; readonly composedInto?: string };

/**
 * Отказ вложить что-либо ВНУТРЬ узла содержимого.
 *
 * Отдельно от правила допуска, потому что спрашивать тут нечего: паспорта у содержимого нет —
 * оно опознаётся родом, а не адресом, — и «часть, которая не пускает» здесь просто не
 * существует. Проверка стоит у обеих правок до всего остального.
 *
 * @param owner узел-владелец
 */
const refuseContentOwner = (owner: AssemblyContent): EditResult =>
  refuse(
    "content-holds-nothing",
    `«${owner.id}» — узел содержимого рода «${owner.genus}»: внутрь него не кладётся ничего`,
  );

/**
 * Проверяет размещение узла внутри владельца — с учётом рода узла и композиции.
 *
 * Содержимое проверяется тем же правилом допуска, что и часть, — кандидатом
 * `{ kind: "content", genus }`. Это и есть весь `PWEB-83`: проверка была с самого начала,
 * не хватало места в дереве.
 *
 * У составного узла проверок ДВЕ, и обе идут по тому же правилу:
 *
 *  1. **место в дереве** — владелец обязан пускать внутрь ВНЕШНИЙ адрес: место занимает
 *     триггер, а не кнопка, и допустимость этого места владелец знает про триггер;
 *  2. **сама композиция** — внешний обязан пускать внутрь ВНУТРЕННИЙ: вставить компонент
 *     туда, где внешний его не допускает, нельзя.
 *
 * У обычного узла вторая проверка не выполняется вовсе — проверять нечего.
 *
 * @param registry реестр
 * @param ownerType адрес узла-владельца
 * @param placed что кладут: род содержимого либо адрес узла вместе с композицией
 * @returns отказ, либо `undefined` — если размещение допустимо
 */
const refusePlacement = (
  registry: Registry,
  ownerType: string,
  placed: Placed,
): EditResult | undefined => {
  if ("genus" in placed) {
    const admitted = canAdmit(registry, ownerType, { kind: "content", genus: placed.genus });
    return admitted.allowed ? undefined : refuse(admitted.refusal, admitted.means);
  }

  const { type, composedInto } = placed;

  const place = canContain(registry, ownerType, composedInto ?? type);
  if (!place.allowed) return refuse(place.refusal, place.means);

  if (composedInto === undefined) return undefined;

  const composition = canContain(registry, composedInto, type);
  if (!composition.allowed) {
    return refuse(
      composition.refusal,
      `вставить «${type}» в «${composedInto}» нельзя: ${composition.means}`,
    );
  }

  return undefined;
};

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
/**
 * Убирает ребёнка из списка детей владельца.
 *
 * Узел содержимого проходит нетронутым: детей у него нет, и убирать из него нечего. Ветка нужна
 * ровно затем, чтобы снятие ребёнка не пришлось повторять с проверкой рода в каждой правке.
 */
const withoutChild = (owner: AssemblyNode, id: NodeId): AssemblyNode =>
  isContent(owner)
    ? owner
    : { ...owner, children: owner.children.filter((child) => child !== id) };

const insertAt = (children: readonly NodeId[], id: NodeId, index?: number): NodeId[] => {
  const next = [...children];
  const place = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
  next.splice(place, 0, id);
  return next;
};

/**
 * Вставляет новый узел внутрь владельца — компонент или содержимое, одной и той же правкой.
 *
 * Место среди детей общее: содержимое и части лежат в одном списке, поэтому «подпись, потом
 * стрелка» и «стрелка, потом подпись» — это `index`, а не две разные механики.
 *
 * @param tree дерево
 * @param registry реестр — источник правил вложенности
 * @param node что вставляем: узел компонента либо узел содержимого
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
  if (isContent(owner)) return refuseContentOwner(owner);

  const refusal = refusePlacement(registry, owner.type, node);
  if (refusal) return refusal;

  const added: AssemblyNode = isContentSpec(node)
    ? {
        id: node.id,
        genus: node.genus,
        value: node.value,
        parentId,
        children: [] as const,
        ...(node.meta ? { meta: node.meta } : {}),
      }
    : {
        id: node.id,
        type: node.type,
        ...(node.composedInto ? { composedInto: node.composedInto } : {}),
        parentId,
        children: [],
        ...(node.props ? { props: node.props } : {}),
        ...(node.meta ? { meta: node.meta } : {}),
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
    if (owner) nodes[ownerId] = withoutChild(owner, id);
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

  if (isContent(owner)) return refuseContentOwner(owner);

  const refusal = refusePlacement(registry, owner.type, node);
  if (refusal) return refusal;

  const nodes = { ...tree.components.nodes };

  const previousId = node.parentId;
  if (previousId !== null) {
    const previous = nodes[previousId];
    if (previous) nodes[previousId] = withoutChild(previous, id);
  }

  // Владельца перечитываем из уже поправленной карты: при переносе внутри одного владельца
  // прежний снимок держит узел на старом месте, и он вернулся бы вторым вхождением. Род его
  // уже проверен выше — содержимым владелец быть не может.
  const target = nodes[parentId] as AssemblyElement;
  nodes[parentId] = { ...target, children: insertAt(target.children, id, index) };
  nodes[id] = { ...node, parentId };

  return { ok: true, tree: withNodes(tree, nodes) };
}

/**
 * Что меняем у узла. Названное поле заменяется целиком, неназванное остаётся как было.
 *
 * Поля разведены по роду узла: пропы бывают у компонента, значение — у содержимого. Названо
 * не про тот род — правка отказывает именем (`patch-not-of-node`), а не молча пропускает: молча
 * пропущенная правка выглядит для человека как «редактор не отреагировал».
 *
 * Вида здесь нет и не будет: он адресуется координатой паспорта либо идентификатором узла и
 * порождается в стили генератором скина, а не приписывается узлу пропом (`PWEB-27`, снятие
 * `styles`). Механика даёт для этого другое — признак, которым узел адресуем в разметке.
 */
export interface NodePatch {
  /** Пропы узла компонента. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Значение узла содержимого — правка подписи (`PWEB-83`). */
  readonly value?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Меняет пропы, значение или редакторское узла.
 *
 * Названное поле заменяется ЦЕЛИКОМ, а не сливается по ключам. Слияние выглядит удобнее ровно
 * до первой попытки убрать один проп: убрать его стало бы нечем, и потребителю пришлось бы
 * заводить своё соглашение об «удаляющем значении» — то есть второе правило поверх нашего.
 *
 * Значение содержимого правится ЗДЕСЬ, а не парой «убрать и вставить»: подпись меняют чаще
 * всего, и пересоздание узла на каждую букву теряло бы его место в списке детей и его имя, по
 * которому узел адресован в разметке.
 *
 * Адрес узла (`type`), род содержимого (`genus`) и композиция (`composedInto`) здесь не
 * меняются: всё это — смена самой сути узла, а значит другая вложенность и другие части. Такое
 * делается парой «убрать и вставить», где обе половины проверяются. Второго способа надеть
 * внешний компонент или сменить род не заводится: один узел — один род.
 *
 * @param tree дерево
 * @param id узел
 * @param patch что заменить
 */
export function updateNode(tree: AssemblyTree, id: NodeId, patch: NodePatch): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);

  const nodes = { ...tree.components.nodes };

  if (isContent(node)) {
    if ("props" in patch) {
      return refuse(
        "patch-not-of-node",
        `«${id}» — узел содержимого: пропов у него нет, правится значение`,
      );
    }
    nodes[id] = {
      ...node,
      ...(patch.value !== undefined ? { value: patch.value } : {}),
      ...("meta" in patch ? { meta: patch.meta } : {}),
    };

    return { ok: true, tree: withNodes(tree, nodes) };
  }

  if ("value" in patch) {
    return refuse(
      "patch-not-of-node",
      `«${id}» — узел компонента «${node.type}»: значения у него нет, содержимое лежит отдельным узлом`,
    );
  }

  nodes[id] = {
    ...node,
    ...("props" in patch ? { props: patch.props } : {}),
    ...("meta" in patch ? { meta: patch.meta } : {}),
  };

  return { ok: true, tree: withNodes(tree, nodes) };
}
