import type { DispatchedEvent } from "@web-core/assembly";

export interface CatalogItem {
  readonly value: string;
  readonly children?: readonly unknown[];
}

export function createCatalogSelection<Item extends CatalogItem>(
  onSelect: (value: string) => void,
): (event: DispatchedEvent) => void {
  return (event) => {
    if (event.name !== "controlClick") return;

    const item = event.context["payload"] as Item | undefined;
    if (item === undefined || item.children !== undefined) return;

    onSelect(item.value);
  };
}
