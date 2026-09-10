import {
  createListCollection,
  createTreeCollection,
  type CollectionItem,
  type ListCollection,
  type TreeCollection,
} from "@ark-ui/solid";

import type { Item } from "../data/fields.js";

export { createListCollection, type CollectionItem, type ListCollection };

export function createItemListCollection(
  items: readonly Item[],
): ListCollection<Item> {
  return createListCollection<Item>({
    items: items as Item[],
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
  });
}

export function createItemTreeCollection(
  root: readonly Item[],
): TreeCollection<Item> {
  return createTreeCollection<Item>({
    rootNode: { value: "ROOT", label: "", children: root as Item[] },
    nodeToValue: (node) => node.value,
    nodeToString: (node) => node.label,
    nodeToChildren: (node) => (node.children ? [...node.children] : []),
  });
}
