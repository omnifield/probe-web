import { useAtom } from "@web-core/store";
import { editorInfoOf } from "@web-core/ui/passport";
import { createEffect, createMemo, For } from "solid-js";

import { componentDataAtom, setCurrentComponent } from "#/entities/component";
import { Preview } from "#/widgets/component";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);
  const assemblies = createMemo(() => editorInfoOf(props.component)?.assemblies ?? []);

  return (
    <For each={assemblies()}>
      {(assembly) => (
        <Preview component={props.component} assembly={assembly.name} data={data()} />
      )}
    </For>
  );
}
