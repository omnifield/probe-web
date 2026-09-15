import { createEffect } from "solid-js";
import { useComponentSkinData } from "@web-core/skin/solid";
import type { ComponentDescriptor } from "#/entities/component";
import { Renderer } from "#/shared/ui/renderer";
import { componentManagerStore } from "../model";

export function DemoStand(props: {
  component: string;
  descriptor: ComponentDescriptor;
  variant: string;
}) {
  const data = useComponentSkinData(props.component);
  const feedData = componentManagerStore.use((state) => state.feedData);

  createEffect(() => {
    console.log(props.descriptor, props.variant);
    console.log(data());
  });

  return (
    <Renderer
      component={props.component}
      variant={props.variant}
      data={feedData()}
    />
  );
}
