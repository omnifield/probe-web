import {
  TabTrigger as ArkTrigger,
  type TabTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TabsTriggerProps = ArkTriggerProps;

export function TabsTrigger(props: TabsTriggerProps) {
  traceLife("ui.tabs-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
