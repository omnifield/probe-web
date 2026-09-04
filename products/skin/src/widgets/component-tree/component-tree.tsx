import type { DispatchedEvent } from "@web-core/assembly";
import { useNavigate, useParams } from "@web-core/router";
import { useAtom } from "@web-core/store";
import { createMemo } from "solid-js";

import { componentTreeAtom } from "#/entities/component/model/store.js";
import type { TreeItemData } from "#/entities/component/model/tree.js";
import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ComponentTree() {
  const tree = useAtom(componentTreeAtom);
  const items = createMemo((): readonly TreeItemData[] => {
    const state = tree();
    return state.status === "done" ? state.data : [];
  });

  const navigate = useNavigate();

  const params = useParams({
    strict: false,
    select: (p) => ({ component: p.component, assembly: p.assembly }),
  });
  const activeValue = createMemo(() => {
    const { component, assembly } = params();
    return component !== undefined && assembly !== undefined
      ? `${component}/${assembly}`
      : undefined;
  });

  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "controlClick") return;

    const payload = event.context["payload"] as TreeItemData | undefined;
    if (payload === undefined || payload.children !== undefined) return;

    const [component, assembly] = payload.id.split("/");
    void navigate({
      to: "/showcase/$component/$assembly",
      params: { component: component!, assembly: assembly! },
    });
  };

  return (
    <Renderer
      component="tree-view"
      assembly="base"
      rootProps={{
        items: items(),
        selectionMode: "single",
        defaultExpandedValue: items().map((item) => item.id),
      }}
      liveProps={{ activeValue: activeValue() }}
      data={{ items: items() }}
      dispatch={onDispatch}
    />
  );
}
