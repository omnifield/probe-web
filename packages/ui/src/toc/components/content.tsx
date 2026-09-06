import {
  TocContent as ArkContent,
  type TocContentProps as ArkContentProps,
} from "@ark-ui/solid/toc";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TocContentProps = ArkContentProps;

// `content` — часть, придуманная китом (см. entity/anatomy.ts) — Ark сам её адресом не метит,
// адрес ставим вручную, тем же способом, что accordion/tree-view для своих придуманных частей.
export function TocContent(props: TocContentProps) {
  traceLife("ui.toc-content");

  return <ArkContent {...dropAddress(props)} {...anatomyParts.content.attrs} />;
}
