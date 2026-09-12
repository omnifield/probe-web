import { GROUPS, groupOf, listComponents } from "@web-core/ui/component-info";

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
        .filter((component) => groupOf(component) === group)
        .map(
          (component): TreeItemData => ({ value: component, label: component }),
        ),
    }))
    .filter((section) => section.children.length > 0);
}
