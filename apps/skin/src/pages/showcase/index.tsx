import { Flow, FlowItem } from "@web-core/ui";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, For } from "solid-js";

import { componentDataAtom, componentHandle, Renderer, setCurrentComponent } from "#/entities/component";
import { Slot } from "#/entities/showcase";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const assemblies = createMemo(() => component.info()?.editorInfo?.assemblies ?? []);
  const tagGroups = createMemo(() => component.info()?.skin?.tags ?? []);

  return (
    <Flow>
      <For each={tagGroups()}>
        {(tag) => (
          <FlowItem>
            <p>{tag.tag}</p>
            <Slot
              slides={assemblies().flatMap((assembly) =>
                tag.variants.map((variant) => (
                  <Renderer
                    component={props.component}
                    assembly={assembly.name}
                    data={data()}
                    variant={variant}
                    dispatch={component.recordEvent}
                  />
                )),
              )}
            />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
