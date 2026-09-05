// см. README.md / FAQ.md

import { isAssemblyContent, isAssemblyRepeat, isDataBinding, resolveDataBinding, scopedPath } from "../engine/passport/assembly/index.js";
import type { PassportAssembly, PassportAssemblyElement, PassportAssemblyNode } from "../engine/passport/assembly/index.js";

/** Same backstop as `expand.ts`'s own `MAX_ASSEMBLY_DEPTH` (see its own comment for why 300, not
 * a rounder, larger number) — this walk recurses through `recur`/`repeat` exactly the same way
 * `growAll` does, so it needs the exact same guard against a self-recursing node with no
 * data-side exit, or data that cycles back on itself. */
const MAX_WALK_DEPTH = 300;

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
 * @param assembly дерево сборки целиком
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
  // `node`/`children`/`recur`/`repeat`/`genus`/`bind`/`value`, all present on the permissive
  // default shape too — so the real-`Data` tree is re-typed to that shape ONCE, right here, and
  // every helper below works with one shape for the rest of the function.
  const tree = assembly.tree as PassportAssemblyElement<Part, Registry>;

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
  // `check-assembly.ts`: this traversal only ever reads `bind`/`children`/`recur`/`repeat`/
  // `genus`/`value`, never anything `Data`-typed narrows, so re-typing once here lets every helper
  // below work with one shape for the rest of the function.
  const walk = (node: PassportAssemblyNode, base: string, where: string, depth: number): void => {
    if (depth > MAX_WALK_DEPTH) {
      flaws.push({
        where,
        path: "",
        means: `checking this assembly against the example data grew past ${MAX_WALK_DEPTH} levels — a self-recursing node with no exit in the example data, or data that cycles back on itself, never stops on its own`,
      });
      return;
    }

    if (isAssemblyRepeat(node)) {
      const { absolute, ok } = checkOne(where, node.repeat.path, base, true);
      // Descending on a repeat.path that didn't resolve would check the template against a scope
      // built on top of a path that is already wrong — every bind inside it would flag too,
      // burying the one real cause under copies of itself.
      if (ok) walk(node.template, `${absolute}/0`, `${where}[]`, depth + 1);
      return;
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const { absolute, ok } = checkOne(where, repeat.path, base, true);
      if (ok) walk(template as PassportAssemblyNode, `${absolute}/0`, `${where}[]`, depth + 1);
      return;
    }

    if (isAssemblyContent(node)) {
      if (isDataBinding(node.value)) checkOne(`${where}.value`, node.value.path, base, false);
      return;
    }

    const label = node.node;

    for (const [prop, path] of Object.entries(node.bind ?? {})) checkOne(`${where}.bind.${prop}`, path, base, false);
    for (const child of node.children ?? []) walk(child, base, `${where} > ${label}`, depth + 1);

    // `recur` re-walks this SAME node one level into its own data — never rescoped/mutated here
    // (unlike `expand.ts`, this file never rewrites paths onto the node itself, only resolves them
    // against a threaded `base` string), so reusing `node` as-is is safe.
    if ("recur" in node && node.recur) {
      const { absolute, ok } = checkOne(`${where}.recur`, node.recur.path, base, true);
      if (ok) walk(node, `${absolute}/0`, `${where}[]`, depth + 1);
    }
  };

  walk(tree, "", `${component}.${assembly.name}`, 0);
  return flaws;
}
