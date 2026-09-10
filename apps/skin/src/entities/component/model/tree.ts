import { GROUPS, editorInfoOf, groupOf } from "@web-core/ui/passport";

import { listComponents } from "./list";

/** `value`, не `id` — канонический `item` кита (`packages/ui/src/shared/data/fields.ts`,
 *  `unified-item-collection-engine`): `createItemTreeCollection` (`packages/ui/src/shared/utils/
 *  collection.ts`) строит узел zag-коллекции строго по `node.value` — `id` для неё не существует
 *  вовсе, дерево с одним только `id` схлопывает identity ВСЕХ узлов в один и тот же `undefined`
 *  (отсюда были найдены баги: раскрытие/закрытие одного узла двигало все разом, активный узел не
 *  подсвечивался — `activeValue` тоже сравнивается по `value`). */
export interface TreeItemData {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

export function treeItems(): readonly TreeItemData[] {
  const components = listComponents();

  return Object.entries(GROUPS)
    .map(([group, title]) => ({
      value: group,
      label: title,
      children: components
        .filter((component) => {
          const editorInfo = editorInfoOf(component);
          return editorInfo !== undefined && groupOf(editorInfo) === group;
        })
        .map((component): TreeItemData => ({ value: component, label: component })),
    }))
    .filter((section) => section.children.length > 0);
}
