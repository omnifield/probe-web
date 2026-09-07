import {
  TocLink as ArkLink,
  type TocLinkProps as ArkLinkProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type TocLinkProps = ArkLinkProps;

export function TocLink(props: TocLinkProps) {
  traceLife("ui.toc-link");

  return <ArkLink {...dropAddress(props)} />;
}
