import type { DispatchedEvent } from "@omnifield/probe-web-assembly";
import { useNavigate } from "@omnifield/probe-web-router";
import { useAtom } from "@omnifield/probe-web-store";

import { componentTreeAtom } from "#/entities/component/model/store.js";
import type { TreeItemData } from "#/entities/component/model/tree.js";
import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ComponentTree() {
  const items = useAtom(componentTreeAtom);
  const navigate = useNavigate();

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
      data={{ items: items() }}
      dispatch={onDispatch}
    />
  );
}
