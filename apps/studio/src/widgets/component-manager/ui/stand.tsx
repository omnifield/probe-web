import {
  Passport,
  SwitchAxisMode,
  SwitchLayoutMode,
  SwitchViewMode,
  Distributor,
} from "#/features/component-manager";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";

export function Stand() {
  return (
    <Surface data-variant="filled">
      <Flow data-variant="column-center">
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Flow style={layoutGroup({ justify: "space-between" })}>
            <Passport />
            <SwitchViewMode />
            <SwitchAxisMode />
            <SwitchLayoutMode />
          </Flow>
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Distributor />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
