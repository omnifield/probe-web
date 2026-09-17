import { run } from "@web-core/generators/mapping";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { createResource, For, Show } from "solid-js";

import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { swagger2Template } from "../../entities/openapi/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";
import { EndpointCard } from "./endpoint-card.js";

/** Тело группы-схемы — распознавание `raw` (сегодня свагер 2.0) и список карточек ручек, ровно то,
 *  чем раньше был весь `OpenapiEditor` до групп. Read-only по составу: чтобы список ручек изменился,
 *  нужно заменить сам `raw` снаружи (перезалить документ), не редактировать ручку поштучно. */
export function SchemaGroupView(props: { raw: string; onInvoke: (endpoint: OpenapiEndpoint, value: unknown, response: InvokeResult) => void }) {
  const [endpoints] = createResource(
    () => (props.raw === "" ? undefined : props.raw),
    (raw) => run(raw, [swagger2Template]),
  );

  return (
    <Flow data-variant="column-center">
      <Show when={endpoints.error}>{(error) => <Typography>{String(error())}</Typography>}</Show>
      <For each={endpoints()}>
        {(endpoint) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <EndpointCard endpoint={endpoint} onInvoke={(value, response) => props.onInvoke(endpoint, value, response)} />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
