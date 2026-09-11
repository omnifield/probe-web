import { Accordion } from "@web-core/ui";
import { useAtom } from "@web-core/store";
import { Index } from "solid-js";

import { endpointsAtom } from "../../model";
import { EndpointItem } from "./item";

export function EndpointList() {
  const endpoints = useAtom(endpointsAtom);

  return (
    <Accordion multiple collapsible>
      <Index each={endpoints()}>{(endpoint) => <EndpointItem endpoint={endpoint()} />}</Index>
    </Accordion>
  );
}
