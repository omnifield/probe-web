import {
  TocItem as ArkItem,
  type TocItemProps as ArkItemProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocItemProps = ArkItemProps;

export function TocItem(props: TocItemProps) {
  traceLife("ui.toc-item");

  return <ArkItem {...dropAddress(props)} />;
}
