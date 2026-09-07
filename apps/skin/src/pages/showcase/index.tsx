import { Flow, FlowItem, Toc, Surface, Typography } from "@web-core/ui";
import { useNavigate } from "@web-core/router";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, For } from "solid-js";

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
  const assemblies = createMemo(
    () => component.info()?.editorInfo?.assemblies ?? [],
  );
  const tagGroups = createMemo(() => component.info()?.skin?.tags ?? []);

  return (
    <Flow data-variant="column-center">
      <For each={tagGroups()}>
        {(tag) => (
          <FlowItem stretch>
            <Slot
              component={props.component}
              assemblies={assemblies()}
              tag={tag.tag}
              variants={tag.variants}
              data={data()}
              dispatch={component.recordEvent}
            />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
