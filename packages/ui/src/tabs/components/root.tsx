import {
  TabsRoot as ArkRoot,
  type TabsRootProps as ArkRootProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TabsProps = ArkRootProps;

export function Tabs(props: TabsProps) {
  traceLife("ui.tabs");

  return <ArkRoot {...dropAddress(props)} />;
}
