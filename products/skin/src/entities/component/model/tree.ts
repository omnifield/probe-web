import { GROUPS, editorInfoOf, groupOf } from "@omnifield/probe-web-ui/passport";

import { listComponents } from "./list.js";

export interface TreeItemData {
  readonly id: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

function componentToTreeItem(component: string): TreeItemData {
  const assemblies = editorInfoOf(component)?.assemblies ?? [];

  if (assemblies.length > 1) {
    return {
      id: component,
      label: component,
      children: assemblies.map((assembly) => ({
        id: `${component}/${assembly.name}`,
        label: assembly.name,
      })),
    };
  }

  return { id: `${component}/${assemblies[0]?.name ?? "base"}`, label: component };
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
        .map(componentToTreeItem),
    }))
    .filter((section) => section.children.length > 0);
}
