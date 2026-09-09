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

export function ShowcasePage(props: { component: string; tag?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);
  const component = componentHandle();

  // `component.info()` теперь сам держит последнее известное значение (правка в componentHandle,
  // не здесь) — на смену компонента больше не проваливается в пусто, значит и `<For>` от него не
  // мигает; локальный буфер, который раньше был здесь, больше не нужен.
  const assemblies = createMemo(
    () => component.info()?.editorInfo?.assemblies ?? [],
  );
  const tagGroups = createMemo(() => component.info()?.skin?.tags ?? []);

  function onDispatch(event: DispatchedEvent) {
    component.recordEvent(event);
    // event.timestamp — ISO-строка (`new Date().toISOString()`), формат уже несёт всё — берём
    // только часы:минуты:секунды, без даты и миллисекунд.
    const time = event.timestamp.slice(11, 19);
    toast.create({
      title: `${event.name}\n${time}`,
      description: JSON.stringify(event.context["payload"], null, 2),
    });
  }

  return (
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
              loading={component.loading()}
              dispatch={onDispatch}
            />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
