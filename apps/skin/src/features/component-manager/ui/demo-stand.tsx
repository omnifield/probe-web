import { createMemo, Match, Switch } from "solid-js";
import type { DispatchedEvent } from "@web-core/assembly";
import type { Form } from "@web-core/skin";
import type { PresetRecord } from "@web-core/skin/presets";
import { useComponentSkinData } from "@web-core/skin/solid";
import { toast } from "@web-core/ui";
import type { ComponentDescriptor } from "#/entities/component";
import { Renderer } from "#/shared/ui/renderer";
import { componentManagerStoreOf } from "../model";

export function DemoStand(props: {
  component: string;
  descriptor: ComponentDescriptor;
  variant: string;
  mode: "demo" | "style" | "assembly";
}) {
  const data = useComponentSkinData<PresetRecord<Form>>(props.component);
  const feedData = createMemo(() =>
    componentManagerStoreOf(props.component).use((state) => state.feedData)(),
  );

  const variantRecipe = () => data()?.state.recipe.variants?.[props.variant];
  const assemblies = () => props.descriptor.editorInfo?.assemblies ?? [];

  function dispatch(event: DispatchedEvent) {
    toast.create({
      title: event.name,
      description: JSON.stringify(event.context, null, 2),
    });
  }
  return (
    <Switch>
      <Match when={props.mode === "demo"}>
        <Renderer
          component={props.component}
          variant={props.variant}
          data={feedData()}
          dispatch={dispatch}
        />
      </Match>
      <Match when={props.mode === "style"}>
        <div>{JSON.stringify(variantRecipe(), null, 2)}</div>
      </Match>
      <Match when={props.mode === "assembly"}>
        <div>{JSON.stringify(assemblies(), null, 2)}</div>
      </Match>
    </Switch>
  );
}
