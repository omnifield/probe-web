import {
  TocIndicator as ArkIndicator,
  type TocIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocIndicatorProps = ArkIndicatorProps;

export function TocIndicator(props: TocIndicatorProps) {
  traceLife("ui.toc-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
