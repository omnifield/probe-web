import { Flow, FlowItem } from "@web-core/ui";
import { createEffect, createMemo, For } from "solid-js";

import { componentHandle, setCurrentComponent } from "#/entities/component";
import { Slot } from "#/entities/showcase";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const component = componentHandle();
  const assemblies = createMemo(
    () => component.info()?.editorInfo?.assemblies ?? [],
  );
  const tagGroups = createMemo(() => component.info()?.skin?.tags ?? []);

  return (
    <Flow data-variant="column">
      <For each={tagGroups()}>
        {(tag) => (
          <FlowItem>
            <p>{tag.tag}</p>
            <Slot assemblies={assemblies()} variants={tag.variants} />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
