import { createContext, Show, useContext, type JSX } from "solid-js";
import { componentDescriptorOf } from "#/entities/component";
import { componentManagerStoreOf } from "./store";

const ComponentNameContext = createContext<string>();

export function ComponentManagerProvider(props: {
  name: string | undefined;
  children: JSX.Element;
}) {
  return (
    <Show when={props.name} keyed>
      {(name) => {
        const descriptor = componentDescriptorOf(name);
        const store = componentManagerStoreOf(name);
        store.actions.setEditorInfo(descriptor.editorInfo);
        store.actions.setIo(descriptor.io);
        store.actions.loadVariants(name);
        store.actions.loadContent(name);

        return (
          <ComponentNameContext.Provider value={name}>
            {props.children}
          </ComponentNameContext.Provider>
        );
      }}
    </Show>
  );
}

export function useComponentName(): string {
  const name = useContext(ComponentNameContext);
  if (name === undefined) {
    throw new Error(
      "useComponentName must be called within ComponentManagerProvider",
    );
  }
  return name;
}
