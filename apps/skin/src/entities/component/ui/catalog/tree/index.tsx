import type { DispatchedEvent } from "@web-core/assembly";
import { useLocation, useNavigate, useParams } from "@web-core/router";
import { createMemo } from "solid-js";

import { Renderer } from "#/shared/ui/renderer";

import { treeItems, type TreeItemData } from "./adapter";

export function Tree() {
  const items = createMemo((): readonly TreeItemData[] => treeItems());

  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });

  const params = useParams({
    strict: false,
    select: (p) => p.component,
  });
  const activeValue = createMemo(() => params());

  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "controlClick") return;

    const payload = event.context["payload"] as TreeItemData | undefined;
    if (payload === undefined || payload.children !== undefined) return;

    const screen = pathname().startsWith("/lab")
      ? "/lab/$component"
      : "/showcase/$component";
    void navigate({ to: screen, params: { component: payload.value } });
  };

  return (
    <Renderer
      component="tree-view"
      assembly="base"
      rootProps={{
        items: items(),
        selectionMode: "single",
        defaultExpandedValue: items().map((item) => item.value),
        activeValue: activeValue(),
      }}
      data={{ items: items() }}
      dispatch={onDispatch}
    />
  );
}
