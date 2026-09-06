import { Renderer, type TreeItemData } from "#/entities/component";
import { Surface } from "@web-core/ui";

const MOCK_ITEMS: readonly TreeItemData[] = [
  { id: "payload", label: "payload" },
  {
    id: "meta",
    label: "meta",
    children: [
      { id: "meta.timestamp", label: "timestamp" },
      { id: "meta.source", label: "source" },
    ],
  },
];

export function Output() {
  return (
    <Surface>
      <Renderer
        component="tree-view"
        assembly="base"
        rootProps={{
          items: MOCK_ITEMS,
          selectionMode: "single",
          defaultExpandedValue: MOCK_ITEMS.map((item) => item.id),
        }}
        data={{ items: MOCK_ITEMS }}
      />
    </Surface>
  );
}
