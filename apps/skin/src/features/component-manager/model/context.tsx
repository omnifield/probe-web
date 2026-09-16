import { createContext, Show, useContext, type JSX } from "solid-js";

const ComponentNameContext = createContext<string>();

export function ComponentManagerProvider(props: {
  name: string | undefined;
  children: JSX.Element;
}) {
  return (
    <Show when={props.name} keyed>
      {(name) => (
        <ComponentNameContext.Provider value={name}>
          {props.children}
        </ComponentNameContext.Provider>
      )}
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
