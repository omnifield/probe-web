import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type GridCellProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

export const GridCell = slotAware(function GridCell<T extends ValidComponent = "div">(props: GridCellProps<T>) {
  traceLife("ui.grid-cell");

  const [address, rest] = useAddress(props, anatomyParts.cell.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
