import {
  createTreeCollection,
  Surface,
  type TreeCollection,
} from "@omnifield/probe-web-ui";
import {
  RenderTree,
  type DispatchedEvent,
} from "@omnifield/probe-web-assembly";
import { useNavigate } from "@omnifield/probe-web-router";
import { createMemo, createSignal } from "solid-js";

import { useComponentGroups } from "../../entities/component/model/store.js";
import { instanceOf } from "../../entities/component/model/instance.js";
import { REGISTRY } from "../../entities/component/model/registry.js";
import { usePreviewAssembly, usePreviewComponent } from "../../entities/preview/model/store.js";
import { groupsToTreeItems, type TreeItemData } from "./adapter.js";

export function ComponentList(props: { variant?: string }) {
  const navigate = useNavigate();
  const groups = useComponentGroups();
  const active = usePreviewComponent();
  const activeAssembly = usePreviewAssembly();
  const data = createMemo(() => groupsToTreeItems(groups()));

  // Клик по ветке (раскрыть/закрыть) — это ОБЫЧНЫЙ клик Zag-глазами, а не только наш `controlClick`:
  // Zag сам на любом клике по строке выполняет `selectNode` (выбирает ТОЛЬКО эту ветку), стирая наш
  // составной путь — `activePath` при этом не меняется (клик по ветке никуда не навигирует), и
  // без явного триггера пересчёта `selectedValue` не уходит обратно в дерево. `tick` — искусственная
  // зависимость: сам факт клика (не важно, по чему) заставляет `activePath` пересчитаться и
  // отправить наш путь заново, поверх того, что Zag только что понаставил себе внутри.
  const [tick, bumpTick] = createSignal(0, { equals: false });

  // Весь путь до активного листа, не только сам лист — id раздела, id компонента, составной id
  // сборки. Zag сам метит `data-selected` на КАЖДЫЙ id из массива `selectedValue`: одна и та же
  // проверка на всех трёх уровнях, ничего не поправлено ни в паспорте, ни в компоненте кита.
  const activePath = createMemo((): readonly string[] => {
    tick();
    const component = active();
    if (component === undefined) return [];

    const group = groups().find((section) => section.components.includes(component));
    const assembly = activeAssembly();

    return [
      ...(group ? [group.group] : []),
      component,
      ...(assembly !== undefined ? [`${component}/${assembly}`] : []),
    ];
  });

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
        selectedValue: activePath(),
        defaultExpandedValue: data().items.map((item) => item.id),
      },
      "base",
      data(),
    ),
  );

  const onDispatch = (event: DispatchedEvent) => {
    if (event.name !== "controlClick") return;

    // Клик по ЛЮБОЙ строке (ветка или лист) — перечитать наш путь и отправить его снова,
    // перекрывая внутренний `selectNode` Zag, см. комментарий у `tick` выше.
    bumpTick((n) => n + 1);

    const payload = event.context["payload"] as TreeItemData | undefined;
    if (payload === undefined || payload.children !== undefined) return;

    // Лист — сборка конкретного компонента, id составной (`компонент/сборка`, см. adapter.ts).
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
