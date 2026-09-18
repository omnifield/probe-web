import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { componentManagerStoreOf, useComponentName } from "../../../../model";
import { cellSize, type Cell } from "../../../../lib/cell";
import { SwitchSecondaryIndex } from "../../controls";
import { Switcher } from "../../views";

type SecondaryItem = { readonly name: string };

export function CellWrapper(props: {
  cell: Cell;
  secondaryItems: readonly SecondaryItem[];
}) {
  const store = componentManagerStoreOf(useComponentName());
  const footprint = store.use((state) => state.editorInfo?.footprint);

  return (
    <Surface style={cellSize(footprint())}>
      <Flow data-variant="column">
        <FlowItem>
          <SwitchSecondaryIndex cell={props.cell} items={props.secondaryItems} />
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Switcher cell={props.cell} />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
