import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type TableHeadProps = JSX.HTMLAttributes<HTMLTableSectionElement>;

export function TableHead(props: TableHeadProps) {
  traceLife("ui.table-head");

  return <thead {...dropAddress(props)} {...anatomyParts.head.attrs} />;
}
