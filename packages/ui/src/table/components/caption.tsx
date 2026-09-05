import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TableCaptionProps = JSX.HTMLAttributes<HTMLTableCaptionElement>;

export function TableCaption(props: TableCaptionProps) {
  traceLife("ui.table-caption");

  return <caption {...dropAddress(props)} {...anatomyParts.caption.attrs} />;
}
