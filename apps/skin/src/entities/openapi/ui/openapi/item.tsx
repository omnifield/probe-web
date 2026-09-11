import { AccordionContent, AccordionControl, AccordionControlIndicator, AccordionItem, Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import {
  removeEndpoint,
  setCurrentEndpointId,
  setEndpointBody,
  setEndpointHeaders,
  setEndpointMethod,
  setEndpointUrl,
  type Endpoint,
} from "../../model";
import { EndpointForm } from "./form";

export interface EndpointItemProps {
  readonly endpoint: Endpoint;
}

export function EndpointItem(props: EndpointItemProps) {
  return (
    <AccordionItem value={props.endpoint.id}>
      <AccordionControl onClick={() => setCurrentEndpointId(props.endpoint.id)}>
        <Typography>
          {props.endpoint.method} {props.endpoint.url === "" ? "(без адреса)" : props.endpoint.url}
        </Typography>
        <AccordionControlIndicator>▾</AccordionControlIndicator>
      </AccordionControl>
      <AccordionContent>
        <Flow data-variant="column-center">
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <EndpointForm
              endpoint={props.endpoint}
              onChangeMethod={(method) => setEndpointMethod(props.endpoint.id, method)}
              onChangeUrl={(url) => setEndpointUrl(props.endpoint.id, url)}
              onChangeBody={(body) => setEndpointBody(props.endpoint.id, body)}
              onChangeHeaders={(headers) => setEndpointHeaders(props.endpoint.id, headers)}
            />
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Button onClick={() => removeEndpoint(props.endpoint.id)}>Удалить эндпоинт</Button>
          </FlowItem>
        </Flow>
      </AccordionContent>
    </AccordionItem>
  );
}
