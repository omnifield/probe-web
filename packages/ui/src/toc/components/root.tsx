import {
  TocRoot as ArkRoot,
  type TocRootProps as ArkRootProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocProps = ArkRootProps;

export function Toc(props: TocProps) {
  traceLife("ui.toc");

  return <ArkRoot {...dropAddress(props)} />;
}
