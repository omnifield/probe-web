import type { Cell } from "../../../../lib/cell";
import { Switcher } from "../../views";

export function CellWrapper(props: { cell: Cell }) {
  return <Switcher cell={props.cell} />;
}
