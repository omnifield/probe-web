import {
  SelectRoot as ArkRoot,
  type SelectRootProps as ArkRootProps,
} from "@ark-ui/solid/select";
import { createMemo, splitProps } from "solid-js";

import {
  createListCollection,
  type CollectionItem,
} from "../../shared/utils/collection.js";
import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export interface SelectProps<T extends CollectionItem = CollectionItem>
  extends Omit<ArkRootProps<T>, "collection"> {
  readonly items: readonly T[];
}

export function Select<T extends CollectionItem = CollectionItem>(props: SelectProps<T>) {
  traceLife("ui.select");

  const [local, rest] = splitProps(props, ["items"]);
  const collection = createMemo(() => createListCollection<T>({ items: local.items ?? [] }));

  return <ArkRoot {...dropAddress(rest)} collection={collection()} />;
}
