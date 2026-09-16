import { Surface } from "@web-core/ui";
import { componentDescriptorOf } from "#/entities/component";
import { componentManagerStoreOf, useComponentName } from "../../model";
import { Container } from "./container";

export function DemoStand() {
  const name = useComponentName();
  const descriptor = componentDescriptorOf(name);
  const store = componentManagerStoreOf(name);
  store.actions.setEditorInfo(descriptor.editorInfo);
  store.actions.setIo(descriptor.io);
  store.actions.loadVariants(name);
  store.actions.loadContent(name);

  return (
    <Surface>
      <Container />
    </Surface>
  );
}
