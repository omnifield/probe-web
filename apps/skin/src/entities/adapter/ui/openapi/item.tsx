import { Button, Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { currentEndpointId, removeEndpoint, setCurrentEndpointId, type Endpoint } from "../../model";

export interface EndpointItemProps {
  readonly endpoint: Endpoint;
}

export function EndpointItem(props: EndpointItemProps) {
  const label = () => `${props.endpoint.method} ${props.endpoint.url === "" ? "(без адреса)" : props.endpoint.url}`;
  const selected = () => currentEndpointId() === props.endpoint.id;

  return (
    <Flow data-variant="row">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button onClick={() => setCurrentEndpointId(props.endpoint.id)}>{selected() ? `→ ${label()}` : label()}</Button>
      </FlowItem>
      <FlowItem>
        <Button onClick={() => removeEndpoint(props.endpoint.id)}>Удалить</Button>
      </FlowItem>
    </Flow>
  );
}
