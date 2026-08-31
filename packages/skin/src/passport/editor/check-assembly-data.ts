// Design notes: ./README.md#check-assembly-data
//
// `checkAssembly` (`./check-assembly.ts`) walks STRUCTURE — admission, anatomy — and by its own
// comment never reads `bind`/`props`/`on`: at the TYPE level that gap is closed by `BoundPath`
// (`../assembly/paths.ts`), which only exists while `tsc` is looking. A sborka built by an agent
// arrives as JSON, and JSON has no compiler over it — a typo in `bind.value`/`repeat.path` is
// exactly as silent as an admission violation would be without `checkAssembly`, just for values
// instead of structure. This file is that second half: it resolves every bound path against a
// REAL data value (an example built from the component's own io schema, by the caller — this file
// never imports `zod` or anything io-shaped; it takes whatever `data` it is handed) and reports
// which ones resolve to nothing.

import { isAssemblyContent, isAssemblyExtra, isAssemblyRef, isAssemblyRepeat, isDataBinding, resolveDataBinding, scopedPath } from "../assembly/index.js";
import type { PassportAssembly, PassportAssemblyElement, PassportAssemblyNode } from "../assembly/index.js";

export interface AssemblyDataFlaw {
  /** Адрес узла в дереве, человекочитаемо: `accordion.base > item[] > itemTrigger.bind.value`. */
  readonly where: string;
  /** Путь, как он написан в записи — то, что автору нужно поправить. */
  readonly path: string;
  readonly means: string;
}

/**
 * Проверяет КАЖДЫЙ `bind`/`repeat.path`/`value.path` дерева сборки против настоящего значения
 * данных — то, чего `checkAssembly` не делает (см. заголовок файла). Путь, не нашедший ничего в
 * `data`, — флав; `repeat.path`, нашедший что-то, но не массив, — тоже, отдельным именем: чинят их
 * по-разному (опечатка в имени поля — против «поле есть, но это не список»).
 *
 * `""` — легальный путь всегда («весь текущий узел данных», `binding.ts`), проверке не подлежит:
 * спросить нечего, узел просто есть.
 *
 * @param component имя компонента — только для адреса в сообщении
 * @param assembly дерево сборки целиком, включая `refs`
 * @param data настоящее значение, с которым сверяются пути — пример по io-схеме или боевые данные
 */
export function checkAssemblyData<Part extends string, Registry extends string = string, Data = unknown>(
  component: string,
  assembly: PassportAssembly<Part, Registry, Data>,
  data: unknown,
): readonly AssemblyDataFlaw[] {
  const flaws: AssemblyDataFlaw[] = [];

  // Same call-boundary reasoning as `check-assembly.ts`'s single `as` (not `as unknown as`, see
  // that file's README section): this traversal never reads anything `Data` narrows — only
  // `node`/`children`/`extra`/`ref`/`repeat`/`genus`/`bind`/`value`, all present on the permissive
  // default shape too — so the real-`Data` tree is re-typed to that shape ONCE, right here, and
  // every helper below works with one shape for the rest of the function.
  const tree = assembly.tree as PassportAssemblyElement<Part, Registry>;
  const refs = assembly.refs as Readonly<Record<string, PassportAssemblyNode<Part, Registry>>> | undefined;

  const checkOne = (where: string, path: string, base: string, mustBeArray: boolean): { absolute: string; ok: boolean } => {
    const absolute = scopedPath(base, path);
    if (path === "") return { absolute, ok: true };

    const value = resolveDataBinding(data, absolute);

    if (value === undefined) {
      flaws.push({ where, path, means: `path "${path}" resolves to nothing against the example data — likely a typo or a field the io schema doesn't declare` });
      return { absolute, ok: false };
    }

    if (mustBeArray && !Array.isArray(value)) {
      flaws.push({ where, path, means: `path "${path}" resolves to a non-array value — "repeat" needs a list to iterate` });
      return { absolute, ok: false };
    }

    return { absolute, ok: true };
  };

  // `Node` widened to the permissive default right after entry — same call-boundary reasoning as
  // `check-assembly.ts`: this traversal only ever reads `bind`/`children`/`extra`/`ref`/`repeat`/
  // `genus`/`value`, never anything `Data`-typed narrows, so re-typing once here lets every helper
  // below work with one shape for the rest of the function.
  const walk = (node: PassportAssemblyNode, base: string, where: string): void => {
    if (isAssemblyRepeat(node)) {
      const { absolute, ok } = checkOne(where, node.repeat.path, base, true);
      // Descending on a repeat.path that didn't resolve would check the template against a scope
      // built on top of a path that is already wrong — every bind inside it would flag too,
      // burying the one real cause under copies of itself.
      if (ok) walk(node.template, `${absolute}/0`, `${where}[]`);
      return;
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const { absolute, ok } = checkOne(where, repeat.path, base, true);
      if (ok) walk(template as PassportAssemblyNode, `${absolute}/0`, `${where}[]`);
      return;
    }

    if (isAssemblyRef(node)) {
      const target = refs?.[node.ref];
      if (!target) return; // declaration defect — `checkAssembly` already names this one

      // Ref's OWN `bind` overrides the template's, same rule `expand.ts`'s `mergeRef` uses to
      // build the real tree — checking the template's untouched `bind` here would flag paths the
      // ref already replaced, and miss the ones it actually wrote.
      const merged =
        "bind" in target || node.bind
          ? ({ ...target, bind: { ...(target as { bind?: Record<string, string> }).bind, ...node.bind } } as PassportAssemblyNode)
          : target;

      walk(merged, base, where);
      return;
    }

    if (isAssemblyContent(node)) {
      if (isDataBinding(node.value)) checkOne(`${where}.value`, node.value.path, base, false);
      return;
    }

    const label = isAssemblyExtra(node) ? `~${node.extra}` : node.node;

    for (const [prop, path] of Object.entries(node.bind ?? {})) checkOne(`${where}.bind.${prop}`, path, base, false);
    for (const child of node.children ?? []) walk(child, base, `${where} > ${label}`);
  };

  walk(tree, "", `${component}.${assembly.name}`);
  return flaws;
}
