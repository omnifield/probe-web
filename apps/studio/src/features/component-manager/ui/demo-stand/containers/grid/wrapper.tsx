import type { Cell } from "../../lib/cell";

export function Wrapper(props: { cell: Cell }) {
  console.log(props.cell);
  return <div>Wrapper</div>;
}
