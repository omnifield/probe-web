import type { TreeItemData } from "#/entities/component/model/catalogs";
import { createMemo } from "solid-js";

import { Renderer } from "#/shared/ui/renderer";
import { createCatalogSelection } from "../lib/selection";

export function CatalogTree(props: {
  adapter: () => readonly TreeItemData[];
  activeValue?: string;
  onSelect: (value: string) => void;
}) {
  const items = createMemo(() => props.adapter());
  const dispatch = createCatalogSelection<TreeItemData>((value) => props.onSelect(value));

  return (
    <Renderer
      component="tree-view"
      assembly="base"
      rootProps={{
        items: items(),
        selectionMode: "single",
        defaultExpandedValue: items().map((item) => item.value),
        activeValue: props.activeValue,
      }}
      data={{ items: items() }}
      dispatch={dispatch}
    />
  );
}
