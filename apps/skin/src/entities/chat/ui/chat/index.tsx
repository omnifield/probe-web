import { Flow, FlowItem } from "@web-core/ui";
import { cardVar } from "@web-core/skin";

import { ChatContent } from "./content/container";
import { ChatControl } from "./control";
import { layoutSelf } from "@web-core/skin";
export function Chat() {
  return (
    <Flow data-variant="column-center" style={{ width: cardVar("card-md") }}>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <ChatContent />
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <ChatControl />
      </FlowItem>
    </Flow>
  );
}
