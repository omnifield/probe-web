import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { createEndpoint } from "../../model";
import { EndpointList } from "./list";

export interface OpenApiProps {
  readonly serviceId: string;
}

export function OpenApi(props: OpenApiProps) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>OpenAPI</Typography>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button onClick={() => createEndpoint(props.serviceId)}>Добавить эндпоинт</Button>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <EndpointList serviceId={props.serviceId} />
      </FlowItem>
    </Flow>
  );
}
