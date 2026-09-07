import type { DispatchedEvent } from "@web-core/assembly";
import { useNavigate, useParams } from "@web-core/router";
import { DEFAULT_TAG } from "@web-core/skin/tags";
import { useAtom } from "@web-core/store";
import { createMemo } from "solid-js";

import {
  componentTreeAtom,
  Renderer,
  type TreeItemData,
} from "#/entities/component";

export function Tree() {
  const tree = useAtom(componentTreeAtom);
  const items = createMemo((): readonly TreeItemData[] => {
    const state = tree();
    return state.status === "done" ? state.data : [];
  });

  const navigate = useNavigate();

  const params = useParams({
    strict: false,
    select: (p) => p.component,
  });
  const activeValue = createMemo(() => params());

  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "controlClick") return;

    const payload = event.context["payload"] as TreeItemData | undefined;
    if (payload === undefined || payload.children !== undefined) return;

    // Тег в дереве не выбирается — клик по компоненту всегда ведёт на дефолтный, листать
    // остальные теги/сборки — дело витрины показа (`entities/showcase/ui/slot`).
    void navigate({
      to: "/showcase/$component/$tag",
      params: { component: payload.id, tag: DEFAULT_TAG },
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
        activeValue: activeValue(),
      }}
      data={{ items: items() }}
      dispatch={onDispatch}
    />
  );
}
