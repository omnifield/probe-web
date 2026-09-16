import { Surface } from "@web-core/ui";
import { createEffect } from "solid-js";
import type { ComponentDescriptor } from "#/entities/component";
import { componentManagerStoreOf } from "../../model";

export function DemoStand(props: {
  component: string;
  descriptor: ComponentDescriptor;
}) {
  createEffect(() => {
    const store = componentManagerStoreOf(props.component);
    store.actions.setEditorInfo(props.descriptor.editorInfo);
    store.actions.setIo(props.descriptor.io);
    store.actions.loadVariants(props.component);
    store.actions.loadContent(props.component);
  });

  return <Surface />;
}
