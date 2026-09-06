import { GROUPS, editorInfoOf, groupOf } from "@web-core/ui/passport";

import { listComponents } from "./list";

export interface TreeItemData {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

export function treeItems(): readonly TreeItemData[] {
  const components = listComponents();

  return Object.entries(GROUPS)
    .map(([group, title]) => ({
      id: group,
      label: title,
      children: components
        .filter((component) => {
          const editorInfo = editorInfoOf(component);
          return editorInfo !== undefined && groupOf(editorInfo) === group;
        })
        .map((component): TreeItemData => ({ id: component, label: component })),
    }))
    .filter((section) => section.children.length > 0);
}
