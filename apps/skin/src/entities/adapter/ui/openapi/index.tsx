import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { createEndpoint } from "../../model";
import { EndpointList } from "./list";

export function OpenApi() {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>OpenAPI</Typography>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button onClick={() => createEndpoint()}>Добавить эндпоинт</Button>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <EndpointList />
      </FlowItem>
    </Flow>
  );
}
