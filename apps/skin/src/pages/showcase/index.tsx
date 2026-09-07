import type { DispatchedEvent } from "@web-core/assembly";
import { Flow, FlowItem, Toc, Surface, Typography, toast } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { useNavigate } from "@web-core/router";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, For, Show } from "solid-js";

import {
  componentDataAtom,
  componentHandle,
  setCurrentComponent,
} from "#/entities/component";
import { Slot } from "#/entities/showcase";

// ВРЕМЕННЫЙ ФИЛЬТР (тот же приём, что `entities/component/model/list.ts`) — витрина показывает
// только доведённые компоненты, у остальных пока "не доступно". Список пуст → все отключены;
// готов скин — имя добавляется сюда одной строкой. Убрать вместе с фильтром списка, когда
// доведены все.
const ENABLED: readonly string[] = ["button"];

export function ShowcasePage(props: { component: string; tag?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const assemblies = createMemo(
    () => component.info()?.editorInfo?.assemblies ?? [],
  );
  const tagGroups = createMemo(() => component.info()?.skin?.tags ?? []);
  const available = createMemo(() => ENABLED.includes(props.component));

  function onDispatch(event: DispatchedEvent) {
    component.recordEvent(event);
    toast.create({
      title: event.name,
      description: JSON.stringify(event.context["payload"], null, 2),
    });
  }

  return (
    <Show when={available()} fallback={<p>не доступно</p>}>
      <Flow data-variant="column-center">
        <For each={tagGroups()}>
          {(tag) => (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Slot
                component={props.component}
                assemblies={assemblies()}
                tag={tag.tag}
                variants={tag.variants}
                data={data()}
                dispatch={onDispatch}
              />
            </FlowItem>
          )}
        </For>
      </Flow>
    </Show>
  );
}
