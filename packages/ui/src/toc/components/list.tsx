import {
  TocList as ArkList,
  type TocListProps as ArkListProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocListProps = ArkListProps;

export function TocList(props: TocListProps) {
  traceLife("ui.toc-list");

  return <ArkList {...dropAddress(props)} />;
}
