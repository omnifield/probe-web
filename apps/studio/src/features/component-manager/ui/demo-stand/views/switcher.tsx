import { Match, Show, Switch } from "solid-js";
import type { Cell } from "../../../lib/cell";
import { componentManagerStoreOf, useComponentName } from "../../../model";
import { Assembly } from "./assembly";
import { Feed } from "./feed";
import { Form } from "./form";
import { Style } from "./style";

export function Switcher(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());

  const mode = () => store.selectors.viewMode(props.cell);
  const variant = () => store.selectors.variantAt(props.cell);
  const assembly = () => store.selectors.assemblyAt(props.cell);

  return (
    <Switch>
      <Match when={mode() === "form"}>
        <Show when={variant()} keyed>
          {(variant) => (
            <Show when={assembly()} keyed>
              {(assembly) => <Form cell={props.cell} variant={variant.name} assembly={assembly} />}
            </Show>
          )}
        </Show>
      </Match>
      <Match when={mode() === "assembly"}>
        <Show when={assembly()} keyed>
          {(assembly) => <Assembly assembly={assembly} />}
        </Show>
      </Match>
      <Match when={mode() === "feed"}>
        <Feed feedData={store.selectors.feedData(props.cell)} />
      </Match>
      <Match when={mode() === "style"}>
        <Style styleData={undefined} />
      </Match>
    </Switch>
  );
}
