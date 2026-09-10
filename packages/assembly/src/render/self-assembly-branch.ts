// см. README.md / FAQ.md

import { createMemo } from "solid-js";

import { readAddress, type Registry } from "../engine/registry.js";
import { growSelfAssembly } from "../engine/self-assembly.js";
import { isContent, type AssemblyNode, type AssemblyTree } from "../engine/tree.js";

/** Узел-ссылка на компонент с объявленным `selfAssembly` — узкое дерево ЕГО СОБСТВЕННОГО
 * поведения, не переопределение `on`/`children` вызывающим. `parentId === null` (сам корень
 * развёрнутого поддерева) исключён нарочно — вторая развёртка НЕ триггерится, self-assembly
 * терминируется сам. */
export function createSelfAssemblyTree(registry: () => Registry, node: () => AssemblyNode | undefined) {
  const selfAssemblyTree = createMemo((): AssemblyTree | undefined => {
    const current = node();
    if (!current || isContent(current) || current.parentId === null) return undefined;

    const read = readAddress(registry(), current.type);
    if (!read || read.part !== read.passport.root || !read.passport.selfAssembly) return undefined;

    return growSelfAssembly(read.passport.selfAssembly, read.address, read.passport.root);
  });
  return selfAssemblyTree;
}
