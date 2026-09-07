import {
  TocTitle as ArkTitle,
  type TocTitleProps as ArkTitleProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocTitleProps = ArkTitleProps;

export function TocTitle(props: TocTitleProps) {
  traceLife("ui.toc-title");

  return <ArkTitle {...dropAddress(props)} />;
}
