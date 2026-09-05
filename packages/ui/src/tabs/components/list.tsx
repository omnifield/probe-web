import {
  TabList as ArkList,
  type TabListProps as ArkListProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TabsListProps = ArkListProps;

export function TabsList(props: TabsListProps) {
  traceLife("ui.tabs-list");

  return <ArkList {...dropAddress(props)} />;
}
