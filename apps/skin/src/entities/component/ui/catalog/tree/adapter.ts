import { KIT } from "@web-core/ui";
import { GROUPS, editorInfoOf, groupOf } from "@web-core/ui/passport";

export interface TreeItemData {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly TreeItemData[];
}

export function treeItems(): readonly TreeItemData[] {
  const components = Object.keys(KIT).sort();

  return Object.entries(GROUPS)
    .map(([group, title]) => ({
      value: group,
      label: title,
      children: components
        .filter((component) => {
          const editorInfo = editorInfoOf(component);
          return editorInfo !== undefined && groupOf(editorInfo) === group;
        })
        .map(
          (component): TreeItemData => ({ value: component, label: component }),
        ),
    }))
    .filter((section) => section.children.length > 0);
}
