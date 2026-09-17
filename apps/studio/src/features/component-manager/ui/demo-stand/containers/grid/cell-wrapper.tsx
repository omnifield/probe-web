import { componentManagerStoreOf, useComponentName } from "../../../../model";
import { cellSize, type Cell } from "../../../../lib/cell";
import { Switcher } from "../../views";
import { Surface } from "@web-core/ui";

export function CellWrapper(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());
  const footprint = store.use((state) => state.editorInfo?.footprint);

  return (
    <Surface style={cellSize(footprint())}>
      <Switcher cell={props.cell} />
    </Surface>
  );
}
