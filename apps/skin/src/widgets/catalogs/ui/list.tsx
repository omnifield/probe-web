import type { JSX } from "solid-js";
import { For } from "solid-js";

export function CatalogList<Item>(props: {
  items: readonly Item[];
  children: (item: Item) => JSX.Element;
}) {
  return <For each={props.items}>{(item) => props.children(item)}</For>;
}
