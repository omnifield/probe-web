import { layoutSelf } from "@web-core/skin";
import { Surface } from "@web-core/ui";
import { componentManagerStoreOf, useComponentName } from "../../../../model";
import { cellSize, type Cell } from "../../../../lib/cell";
import { Switcher } from "../../views";

export function Wrapper(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());
  const footprint = store.use((state) => state.editorInfo?.footprint);

  return (
    <Surface style={{ ...cellSize(footprint()), ...layoutSelf({ align: "stretch" }) }}>
      <Switcher cell={props.cell} />
    </Surface>
  );
}
