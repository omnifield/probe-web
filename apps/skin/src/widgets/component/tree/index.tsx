import type { DispatchedEvent } from "@web-core/assembly";
import { useLocation, useNavigate, useParams } from "@web-core/router";
import { useAtom } from "@web-core/store";
import { createMemo } from "solid-js";

import { componentTreeAtom, type TreeItemData } from "#/entities/component";
import { Renderer } from "#/shared/ui/renderer";

export function Tree() {
  const tree = useAtom(componentTreeAtom);
  const items = createMemo((): readonly TreeItemData[] => {
    const state = tree();
    return state.status === "done" ? state.data : [];
  });

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

    // Один сегмент — имя компонента, без тега: тег/вариант листает сама витрина
    // (`entities/showcase/ui/slot`), дерево его не выбирает. Экран (showcase/lab) не меняем —
    // остаёмся там, где кликнули (`/lab/$component`, если были на `/lab`, иначе `/showcase/
    // $component`), не тащим юзера обратно на витрину.
    const screen = pathname().startsWith("/lab") ? "/lab/$component" : "/showcase/$component";
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
