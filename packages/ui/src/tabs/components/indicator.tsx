import {
  TabIndicator as ArkIndicator,
  type TabIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TabsIndicatorProps = ArkIndicatorProps;

export function TabsIndicator(props: TabsIndicatorProps) {
  traceLife("ui.tabs-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
