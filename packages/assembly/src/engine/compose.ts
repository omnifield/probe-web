// см. README.md / FAQ.md

import { insertNode, type EditRefusal, type NewNode } from "./edits.js";
import type { Genus } from "./passport-read.js";
import { readAddress, type Registry } from "./registry.js";
import type { AssemblyElement, AssemblyTree, DispatchAction, NodeId } from "./tree.js";

/**
 * Первый узел дерева — родителя у него нет, вкладывать не во что, проверять нечего, кроме того,
 * что адрес вообще существует в реестре (`insertNode` этот случай не покрывает: ему всегда
 * нужен существующий `parentId`, для корня его по определению нет).
 */
export function rootNode(registry: Registry, address: string, id?: NodeId): AssemblyTree | undefined {
  const read = readAddress(registry, address);
  if (!read) return undefined;

  const rootId = id ?? read.address;
  const node: AssemblyElement = { id: rootId, type: read.address, parentId: null, children: [] };

  return { components: { root: rootId, nodes: { [rootId]: node } } };
}

export interface CompositionElement {
  readonly type: string;
  readonly id?: NodeId;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  readonly children?: readonly CompositionSpec[];
}

export interface CompositionContent {
  readonly genus: Genus;
  readonly value: string;
  readonly id?: NodeId;
}

export type CompositionSpec = CompositionElement | CompositionContent;

export interface CompositionRefusal {
  readonly id: NodeId;
  readonly refusal: EditRefusal;
  readonly means: string;
}

export type CompositionResult =
  | { readonly ok: true; readonly tree: AssemblyTree }
  | { readonly ok: false; readonly refusals: readonly CompositionRefusal[] };

const isContentSpec = (spec: CompositionSpec): spec is CompositionContent => "genus" in spec;

const slugOf = (type: string): string => (type.includes(".") ? type.slice(type.lastIndexOf(".") + 1) : type);

function nextId(parentId: NodeId, slug: string, taken: ReadonlySet<NodeId>): NodeId {
  const base = `${parentId}.${slug}`;
  if (!taken.has(base)) return base;

  for (let ordinal = 2; ; ordinal += 1) {
    const candidate = `${base}-${ordinal}`;
    if (!taken.has(candidate)) return candidate;
  }
}

function withRootExtras(tree: AssemblyTree, spec: CompositionElement): AssemblyTree {
  if (!spec.props && !spec.bind && !spec.on) return tree;

  const root = tree.components.root;
  const node = tree.components.nodes[root] as AssemblyElement;

  return {
    components: {
      root,
      nodes: {
        ...tree.components.nodes,
        [root]: {
          ...node,
          ...(spec.props ? { props: spec.props } : {}),
          ...(spec.bind ? { bind: spec.bind } : {}),
          ...(spec.on ? { on: spec.on } : {}),
        },
      },
    },
  };
}

/**
 * Композиция ЦЕЛЫХ компонентов одним вызовом — модуль собирается тем же приёмом, что и один
 * компонент из своих частей, только уровнем выше: каждый узел спеки кладётся тем же `insertNode`,
 * что и ручная правка, никакой отдельной копии правила вложенности здесь нет. Узел, которому
 * отказано, не останавливает всю сборку — отказы собираются ВСЕ сразу (тем же приёмом, что
 * `checkTree`), просто его собственная ветка дальше не растится (дети отказавшего узла всё равно
 * получили бы `parent-unknown` — это был бы шум, не новая информация).
 */
export function composeTree(registry: Registry, spec: CompositionElement, rootId?: NodeId): CompositionResult {
  const wantedRootId = rootId ?? spec.id;
  const base = rootNode(registry, spec.type, wantedRootId);
  if (!base) {
    return {
      ok: false,
      refusals: [
        {
          id: wantedRootId ?? spec.type,
          refusal: "parent-unknown",
          means: `адрес «${spec.type}» реестру неизвестен — компоновать нечего`,
        },
      ],
    };
  }

  const root = base.components.root;
  let tree = withRootExtras(base, spec);

  const refusals: CompositionRefusal[] = [];
  const taken = new Set<NodeId>([root]);

  const place = (children: readonly CompositionSpec[] | undefined, parentId: NodeId): void => {
    for (const child of children ?? []) {
      const childId = child.id ?? nextId(parentId, isContentSpec(child) ? "content" : slugOf(child.type), taken);
      taken.add(childId);

      const node: NewNode = isContentSpec(child)
        ? { id: childId, genus: child.genus, value: child.value }
        : {
            id: childId,
            type: child.type,
            ...(child.props ? { props: child.props } : {}),
            ...(child.bind ? { bind: child.bind } : {}),
            ...(child.on ? { on: child.on } : {}),
          };

      const result = insertNode(tree, registry, node, parentId);
      if (!result.ok) {
        refusals.push({ id: childId, refusal: result.refusal, means: result.means });
        continue;
      }

      tree = result.tree;
      if (!isContentSpec(child)) place(child.children, childId);
    }
  };

  place(spec.children, root);

  return refusals.length > 0 ? { ok: false, refusals } : { ok: true, tree };
}
