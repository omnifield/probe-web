// Фикстура-канон: код написан по правилам Solid и обязан проходить пресет ЧИСТО.
// Умолчания — через `mergeProps`, rest — через `splitProps`, доступ к props — свойством.
import { mergeProps, splitProps, type JSX } from "solid-js";

export interface GreetingProps {
  name?: string;
  onPick?: () => void;
  children?: JSX.Element;
}

export function Greeting(rawProps: GreetingProps) {
  const props = mergeProps({ name: "мир" }, rawProps);
  const [local, rest] = splitProps(props, ["children"]);

  return (
    <section>
      <h1>Привет, {rest.name}</h1>
      <button type="button" onClick={() => props.onPick?.()}>
        выбрать
      </button>
      {local.children}
    </section>
  );
}
