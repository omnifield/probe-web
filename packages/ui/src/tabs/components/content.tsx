import {
  TabContent as ArkContent,
  type TabContentProps as ArkContentProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TabsContentProps = ArkContentProps;

export function TabsContent(props: TabsContentProps) {
  traceLife("ui.tabs-content");

  return <ArkContent {...dropAddress(props)} />;
}
