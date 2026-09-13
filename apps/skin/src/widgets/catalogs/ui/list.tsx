import type { JSX } from "solid-js";
import { For } from "solid-js";
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

export function CatalogList<Item>(props: {
  items: readonly Item[];
  children: (item: Item) => JSX.Element;
}) {
  return (
    <Flow data-variant="column-center">
      <For each={props.items}>
        {(item) => <FlowItem style={layoutSelf({ align: "stretch" })}>{props.children(item)}</FlowItem>}
      </For>
    </Flow>
  );
}
