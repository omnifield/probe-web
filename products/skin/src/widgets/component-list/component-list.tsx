import { createTreeCollection, type TreeCollection } from "@omnifield/probe-web-ui";
import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";
import { useNavigate } from "@omnifield/probe-web-router";
import { createMemo } from "solid-js";

import { useComponentGroups } from "../../entities/component/model/store.js";
import { instanceOf } from "../../entities/component/model/instance.js";
import { REGISTRY } from "../../entities/component/model/registry.js";
import { usePreviewComponent } from "../../entities/preview/model/store.js";
import { groupsToTreeItems, type TreeItemData } from "./adapter.js";

export function ComponentList(props: {
  variant?: string;
}) {
  const navigate = useNavigate();
  const groups = useComponentGroups();
  const active = usePreviewComponent();
  const data = createMemo(() => groupsToTreeItems(groups()));

  const collection = createMemo(
    (): TreeCollection<TreeItemData> =>
      createTreeCollection<TreeItemData>({
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.label,
        rootNode: { id: "ROOT", label: "", children: data().items },
      }),
  );

  const tree = createMemo(() =>
    instanceOf(
      "tree-view",
      {
        "data-variant": props.variant,
        collection: collection(),
        selectionMode: "single",
        selectedValue: active() ? [active()] : [],
        defaultExpandedValue: data().items.map((item) => item.id),
      },
      "groups",
      data(),
    ),
  );

  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "controlClick") return;

    const payload = event.context["payload"] as TreeItemData | undefined;
    if (payload === undefined || payload.children !== undefined) return;

    void navigate({ to: "/showcase/$component", params: { component: payload.id } });
  };

  return <RenderTree tree={tree()} registry={REGISTRY} data={data()} dispatch={onDispatch} />;
}
