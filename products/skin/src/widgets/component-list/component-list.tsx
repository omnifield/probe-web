import { Surface } from "@omnifield/probe-web-ui";
import {
  RenderTree,
  type DispatchedEvent,
} from "@omnifield/probe-web-assembly";
import { useNavigate, useParams } from "@omnifield/probe-web-router";
import { createMemo } from "solid-js";

import { useComponentGroups } from "../../entities/component/model/store.js";
import { instanceOf } from "../../entities/component/model/instance.js";
import { REGISTRY } from "../../entities/component/model/registry.js";

import { groupsToTreeItems, type TreeItemData } from "./adapter.js";

export function ComponentList(props: { variant?: string }) {
  const navigate = useNavigate();
  const groups = useComponentGroups();
  const data = createMemo(() => groupsToTreeItems(groups()));

  // Дерево само не знает, какой компонент сейчас показан — это решает адрес. Айди листа тот же,
  // что кладёт `adapter.ts` (`компонент/сборка`), нет `$assembly` в адресе (пока на разделе или
  // на компоненте без сборки) — подсвечивать нечего, дерево работает своей внутренней логикой.
  const params = useParams({ strict: false, select: (p) => ({ component: p.component, assembly: p.assembly }) });
  const activeValue = createMemo(() => {
    const { component, assembly } = params();
    return component !== undefined && assembly !== undefined ? `${component}/${assembly}` : undefined;
  });

  const tree = createMemo(() =>
    instanceOf(
      "tree-view",
      {
        "data-variant": props.variant,
        items: data().items,
        selectionMode: "single",
        defaultExpandedValue: data().items.map((item) => item.id),
        activeValue: activeValue(),
      },
      "base",
      data(),
    ),
  );

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
    <Surface>
      <RenderTree
        tree={tree()}
        registry={REGISTRY}
        data={data()}
        dispatch={onDispatch}
      />
    </Surface>
  );
}
