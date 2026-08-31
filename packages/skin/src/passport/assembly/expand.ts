// Design notes: ./README.md#expand

import type { ComponentPassport } from "../form/index.js";
import type { PassportAssembly } from "./assembly.js";
import { isDataBinding, resolveDataBinding } from "./binding.js";
import {
  isAssemblyContent,
  isAssemblyExtra,
  isAssemblyRef,
  isAssemblyRepeat,
  type PassportAssemblyContent,
  type PassportAssemblyElement,
  type PassportAssemblyExtra,
  type PassportAssemblyNode,
  type PassportAssemblyRef,
} from "./nodes.js";
import type { BaseAssemblyNode, BaseAssemblyTree } from "./output.js";

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

  const addressOfExtra = (extra: string): string => `${address}.~${extra}`;

  const scopeTemplate = (node: PassportAssemblyNode, base: string): PassportAssemblyNode => {
    if (isAssemblyContent(node)) {
      return isDataBinding(node.value) ? { ...node, value: { path: scopedPath(base, node.value.path) } } : node;
    }

    if (isAssemblyRepeat(node)) {
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    if ("repeat" in node && node.repeat) {
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

    return {
      ...node,
      ...(boundBind ? { bind: boundBind } : {}),
      ...(boundOn ? { on: boundOn } : {}),
      ...(boundChildren ? { children: boundChildren } : {}),
    };
  };

  const grow = (
    node: PassportAssemblyElement | PassportAssemblyContent | PassportAssemblyExtra,
    parentId: string | null,
  ): string => {
    if (isAssemblyContent(node)) {
      const id = nameFor(node.genus);

      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };

      return id;
    }

    if (isAssemblyExtra(node)) {
      const id = nameFor(node.extra);
      const children: string[] = [];

      nodes[id] = {
        id,
        type: addressOfExtra(node.extra),
        parentId,
        children,
        ...(node.props ? { props: node.props } : {}),
        ...(node.bind ? { bind: node.bind } : {}),
        ...(node.on ? { on: node.on } : {}),
      };

      for (const child of node.children ?? []) children.push(...growAll(child, id));

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
      ...(node.props ? { props: node.props } : {}),
      ...(node.bind ? { bind: node.bind } : {}),
      ...(node.on ? { on: node.on } : {}),
    };

    for (const child of node.children ?? []) children.push(...growAll(child, id));

    return id;
  };

  const mergeRef = (template: PassportAssemblyNode, ref: PassportAssemblyRef): PassportAssemblyNode => {
    if (isAssemblyContent(template) || isAssemblyRepeat(template)) return template;

    const props = ref.props || template.props ? { ...template.props, ...ref.props } : undefined;
    const bind = ref.bind || template.bind ? { ...template.bind, ...ref.bind } : undefined;
    const on = ref.on || template.on ? { ...template.on, ...ref.on } : undefined;

    return {
      ...template,
      ...(props ? { props } : {}),
      ...(bind ? { bind } : {}),
      ...(on ? { on } : {}),
    };
  };

  const growAll = (node: PassportAssemblyNode, parentId: string | null): string[] => {
    if (isAssemblyRepeat(node)) {
      const items = resolveDataBinding(data, node.repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) =>
        growAll(scopeTemplate(node.template, `${node.repeat.path}/${index}`), parentId),
      );
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const items = resolveDataBinding(data, repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) =>
        growAll(scopeTemplate(template as PassportAssemblyNode, `${repeat.path}/${index}`), parentId),
      );
    }

    if (isAssemblyRef(node)) {
      const template = assembly.refs?.[node.ref];
      if (!template) {
        throw new Error(
          `assembly "${assembly.name}" references "${node.ref}", which is not in its refs — a declaration defect`,
        );
      }

      return growAll(mergeRef(template, node), parentId);
    }

    return [grow(node, parentId)];
  };

  const root = grow(assembly.tree, null);

  return {
    components: {
      root,
      nodes,
      ...(assembly.providerProps ? { providerProps: assembly.providerProps } : {}),
    },
  };
}
