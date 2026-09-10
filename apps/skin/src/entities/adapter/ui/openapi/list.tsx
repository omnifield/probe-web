import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { useAtom } from "@web-core/store";
import { Index } from "solid-js";

import { endpointsAtom } from "../../model";
import { EndpointItem } from "./item";

export function EndpointList() {
  const endpoints = useAtom(endpointsAtom);

  return (
    <Flow data-variant="column-center">
      <Index each={endpoints()}>
        {(endpoint) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <EndpointItem endpoint={endpoint()} />
          </FlowItem>
        )}
      </Index>
    </Flow>
  );
}
