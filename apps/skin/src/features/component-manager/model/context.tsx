import {
  createContext,
  createSignal,
  Show,
  useContext,
  type Accessor,
  type JSX,
  type Setter,
} from "solid-js";

const ComponentNameContext = createContext<string>();

export type Mode = "matrix" | "grid";
const DEFAULT_MODE: Mode = "matrix";

const ModeContext = createContext<{
  mode: Accessor<Mode>;
  setMode: Setter<Mode>;
}>();

export function ComponentManagerProvider(props: {
  name: string | undefined;
  children: JSX.Element;
}) {
  const [mode, setMode] = createSignal<Mode>(DEFAULT_MODE);

  return (
    <Show when={props.name} keyed>
      {(name) => (
        <ComponentNameContext.Provider value={name}>
          <ModeContext.Provider value={{ mode, setMode }}>
            {props.children}
          </ModeContext.Provider>
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

export function useMode(): { mode: Accessor<Mode>; setMode: Setter<Mode> } {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be called within ComponentManagerProvider");
  }
  return context;
}
