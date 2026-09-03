import {
  ListboxRoot as ArkRoot,
  type ListboxRootProps as ArkRootProps,
} from "@ark-ui/solid/listbox";
import { createMemo, splitProps } from "solid-js";

import {
  createListCollection,
  type CollectionItem,
} from "../../shared/utils/collection.js";
import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export interface ListboxProps<T extends CollectionItem = CollectionItem>
  extends Omit<ArkRootProps<T>, "collection"> {
  readonly items: readonly T[];
}

export function Listbox<T extends CollectionItem = CollectionItem>(props: ListboxProps<T>) {
  traceLife("ui.listbox");

  const [local, rest] = splitProps(props, ["items"]);
  const collection = createMemo(() => createListCollection<T>({ items: local.items ?? [] }));

  return <ArkRoot {...dropAddress(rest)} collection={collection()} />;
}
