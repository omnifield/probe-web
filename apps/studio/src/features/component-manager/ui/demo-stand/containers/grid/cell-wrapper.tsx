import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { componentManagerStoreOf, useComponentName } from "../../../../model";
import { cellSize, type Cell } from "../../../../lib/cell";
import { SwitchAxisModeLocal } from "../../controls";
import { Switcher } from "../../views";

export function CellWrapper(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());
  const footprint = store.use((state) => state.editorInfo?.footprint);

  return (
    <Surface style={cellSize(footprint())}>
      <Flow data-variant="column">
        <FlowItem>
          <SwitchAxisModeLocal cell={props.cell} />
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Switcher cell={props.cell} />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
