import {
  TocNav as ArkNav,
  type TocNavProps as ArkNavProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TocNavProps = ArkNavProps;

// `nav` — та же история, что `content`: придумана китом, Ark её не адресует сам.
export function TocNav(props: TocNavProps) {
  traceLife("ui.toc-nav");

  return <ArkNav {...dropAddress(props)} {...anatomyParts.nav.attrs} />;
}
