import type { JSX } from "solid-js";
import { For } from "solid-js";

export interface ListItem {
  readonly value: string;
  readonly label: string;
}

export function CatalogList(props: {
  items: readonly ListItem[];
  children: (item: ListItem) => JSX.Element;
}) {
  return <For each={props.items}>{(item) => props.children(item)}</For>;
}
