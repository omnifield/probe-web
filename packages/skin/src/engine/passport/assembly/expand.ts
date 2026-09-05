
import type { ComponentPassport } from "../form/index.js";
import type { PassportAssembly } from "./assembly.js";
import { isDataBinding, resolveDataBinding } from "./binding.js";
import {
  isAssemblyContent,
  isAssemblyRepeat,
  type PassportAssemblyContent,
  type PassportAssemblyElement,
  type PassportAssemblyNode,
} from "./nodes.js";
import { isContentNode, type BaseAssemblyElement, type BaseAssemblyNode, type BaseAssemblyTree } from "./output.js";

/**
 * Абсолютит путь узла относительно текущего масштаба (`base`) — тот же приём, каким
 * `binding.ts`'s `resolveDataBinding` в итоге ждёт путь: `""` значит «весь текущий узел данных»,
 * ведущий `/` — уже абсолютный (от корня `io.input`), иначе — относительный от `base`.
 *
 * Публичная функция, не приватность `baseAssemblyOf`: любой, кто обходит дерево сборки САМ (не
 * через порождение узлов, а, например, чтобы ПРОВЕРИТЬ путь до записи — `passport/editor`), обязан
 * абсолютить путь тем же способом, каким это делает рантайм при развороте `repeat`, иначе два
 * читателя path однажды разойдутся на том, что легально.
 *
 * @param base текущий масштаб — `""` на корне, `"/sections/0"` внутри первого `repeat`-элемента
 * @param path путь узла, как он написан в записи — `""`, относительный или абсолютный
 */
export function scopedPath(base: string, path: string): string {
  return path === "" ? base : path.startsWith("/") ? path : `${base}/${path}`;
}

/**
 * Guards `grow`/`growAll`'s mutual recursion against an unbounded chain — a self-recursing
 * `recur` with no exit in its own data, or `repeat`-wrapped data that happens to cycle (a node's
 * own descendant array circling back to an ancestor), both recurse with no other exit condition.
 * 300 comfortably exceeds any real assembly's structural depth while staying well short of a
 * native stack overflow — `recur` chains more real call frames per logical level than a flat
 * `repeat` does (`grow` → its own children → the `recur` re-entry → `growAll` again), so this sits
 * lower than a naive per-frame budget would suggest; measured empirically against this same
 * engine (`test/assembly-depth-guard.test.ts`), not assumed.
 */
const MAX_ASSEMBLY_DEPTH = 300;

export function baseAssemblyOf(
  passport: ComponentPassport,
  assembly: PassportAssembly,
  address: string = passport.component,
  data?: unknown,
): BaseAssemblyTree {
  const nodes: Record<string, BaseAssemblyNode> = {};
  const taken = new Set<string>();

  const declared = passport.anatomy.keys();

  const nameFor = (base: string): string => {
    for (let ordinal = 1; ; ordinal += 1) {
      const name = ordinal === 1 ? base : `${base}-${ordinal}`;
      if (!taken.has(name)) {
        taken.add(name);
        return name;
      }
    }
  };

  const addressOf = (part: string): string => (part === passport.root ? address : `${address}.${part}`);

  const scopeTemplate = (node: PassportAssemblyNode, base: string): PassportAssemblyNode => {
    if (isAssemblyContent(node)) {
      return isDataBinding(node.value) ? { ...node, value: { path: scopedPath(base, node.value.path) } } : node;
    }

    if (isAssemblyRepeat(node)) {
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    if ("repeat" in node && node.repeat) {
      // A nested repeat found while walking an OUTER template's own children (see the generic
      // branch below) — only its `repeat.path` needs fixing up here, so a LATER pass (when
      // `growAll` actually unwraps THIS repeat) resolves the right array. `bind`/`children`/
      // `recur` on this same node get their real scoping on that later pass, once `repeat` is
      // stripped and this same function runs again through the generic branch.
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    const boundBind = node.bind
      ? Object.fromEntries(Object.entries(node.bind).map(([name, path]) => [name, scopedPath(base, path)]))
      : undefined;
    const boundOn = node.on
      ? Object.fromEntries(
          Object.entries(node.on).map(([domEvent, action]) => [
            domEvent,
            {
              event: {
                name: action.event.name,
                ...(action.event.context
                  ? {
                      context: Object.fromEntries(
                        Object.entries(action.event.context).map(([key, value]) => [
                          key,
                          isDataBinding(value) ? { path: scopedPath(base, value.path) } : value,
                        ]),
                      ),
                    }
                  : {}),
              },
            },
          ]),
        )
      : undefined;
    const boundChildren = "children" in node ? node.children?.map((child) => scopeTemplate(child, base)) : undefined;
    const boundRecur = "recur" in node && node.recur ? { ...node.recur, path: scopedPath(base, node.recur.path) } : undefined;

    return {
      ...node,
      ...(boundBind ? { bind: boundBind } : {}),
      ...(boundOn ? { on: boundOn } : {}),
      ...(boundChildren ? { children: boundChildren } : {}),
      ...(boundRecur ? { recur: boundRecur } : {}),
    };
  };

  // Props a node's OWN `props` plus, when it named `indexPathBind`, the accumulated repeat index
  // under that key — a literal `number[]`, never a `bind` path (see `ElementFields.indexPathBind`).
  const propsOf = (node: { props?: Readonly<Record<string, unknown>>; indexPathBind?: string }, indexPath: readonly number[]) =>
    node.props || node.indexPathBind ? { props: { ...node.props, ...(node.indexPathBind ? { [node.indexPathBind]: indexPath } : {}) } } : {};

  // `pristine` — the never-yet-scoped literal a `recur` on THIS node would need to reuse. A
  // repeat's own `template` (both forms) is already kept around unscoped for exactly this reason
  // (re-applied fresh on every index); `recur` needs the same discipline for the same reason —
  // re-scoping an ALREADY-scoped node is a no-op on every path that already starts with "/"
  // (`scopedPath`'s own absolute-path short-circuit), so reusing the post-scope `node` itself
  // would freeze every recursive level at the FIRST level's bindings. Defaults to `node`: a plain
  // child reached by ordinary nesting (not through a `repeat`) is never scoped away from how its
  // author wrote it, so it already IS its own pristine form.
  const grow = (
    node: PassportAssemblyElement | PassportAssemblyContent,
    parentId: string | null,
    indexPath: readonly number[],
    base: string,
    depth: number,
    pristine: PassportAssemblyNode = node,
  ): string => {
    if (isAssemblyContent(node)) {
      const id = nameFor(node.genus);

      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };

      return id;
    }

    const isOwnPart = declared.includes(node.node);
    const id = nameFor(isOwnPart && node.node === passport.root ? address : node.node);
    const children: string[] = [];

    nodes[id] = {
      id,
      type: isOwnPart ? addressOf(node.node) : node.node,
      parentId,
      children,
      ...propsOf(node, indexPath),
      ...(node.bind ? { bind: node.bind } : {}),
      ...(node.on ? { on: node.on } : {}),
    };

    for (const child of node.children ?? []) children.push(...growAll(child, id, indexPath, base, depth + 1));

    if (node.recur) {
      const items = resolveDataBinding(data, node.recur.path);

      if (Array.isArray(items)) {
        const targetType = declared.includes(node.recur.into) ? addressOf(node.recur.into) : node.recur.into;
        const targetId = children.find((childId) => {
          const target = nodes[childId];
          return target !== undefined && !isContentNode(target) && target.type === targetType;
        });

        if (targetId) {
          const grown = items.flatMap((_, index) => {
            const scoped = `${node.recur!.path}/${index}`;
            return growAll(scopeTemplate(pristine, scoped), targetId, [...indexPath, index], scoped, depth + 1, pristine);
          });

          const target = nodes[targetId] as BaseAssemblyElement;
          nodes[targetId] = { ...target, children: [...target.children, ...grown] };
        }
      }
    }

    return id;
  };

  const growAll = (
    node: PassportAssemblyNode,
    parentId: string | null,
    indexPath: readonly number[],
    base: string,
    depth: number,
    pristine: PassportAssemblyNode = node,
  ): string[] => {
    if (depth > MAX_ASSEMBLY_DEPTH) {
      const at = "node" in node ? `node "${node.node}"` : "content node";
      throw new Error(
        `assembly "${assembly.name}" grew past ${MAX_ASSEMBLY_DEPTH} levels at ${at} — a self-recursing node with ` +
          `no exit in its data, or repeat-bound data that cycles back on itself, never stops on its own`,
      );
    }

    if (isAssemblyRepeat(node)) {
      const items = resolveDataBinding(data, node.repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) => {
        const scoped = `${node.repeat.path}/${index}`;
        return growAll(scopeTemplate(node.template, scoped), parentId, [...indexPath, index], scoped, depth + 1, node.template);
      });
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const items = resolveDataBinding(data, repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) => {
        const scoped = `${repeat.path}/${index}`;
        return growAll(
          scopeTemplate(template as PassportAssemblyNode, scoped),
          parentId,
          [...indexPath, index],
          scoped,
          depth + 1,
          template as PassportAssemblyNode,
        );
      });
    }

    return [grow(node, parentId, indexPath, base, depth, pristine)];
  };

  const root = grow(assembly.tree, null, [], "", 0);

  return {
    components: {
      root,
      nodes,
      ...(assembly.providerProps ? { providerProps: assembly.providerProps } : {}),
    },
  };
}
