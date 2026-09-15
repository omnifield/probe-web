import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { For } from "solid-js";

import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { Button } from "../../features/edit-value/index.js";
import { invokeEndpoint } from "../../features/invoke-endpoint/index.js";
import type { OpenapiInvocation } from "./types.js";

/** Ручка + уже настроенные параметры (собраны заранее, обычно `OpenapiEditor` на другом экране). */
export interface OpenapiListItem {
  readonly endpoint: OpenapiEndpoint;
  readonly value: unknown;
}

/** Компактный вид мода 2 — витрина: список уже настроенных ручек, никакого UI редактирования полей,
 *  только «Вызвать» на каждую. Для случая «настройка ручки — отдельный экран (`OpenapiEditor`),
 *  а дёргать её нужно в другом месте (например, показ компонента)». */
export function OpenapiList(props: {
  items: readonly OpenapiListItem[];
  onChange: (invocation: OpenapiInvocation) => void;
}) {
  async function invoke(item: OpenapiListItem) {
    const response = await invokeEndpoint(item.endpoint, item.value);
    props.onChange({ endpoint: item.endpoint, value: item.value, response });
  }

  return (
    <Flow data-variant="column-center">
      <For each={props.items}>
        {(item) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Flow
              style={{
                ...layoutGroup({ justify: "space-between", align: "center" }),
                ...layoutSelf({ align: "stretch" }),
              }}
            >
              <Typography>
                {item.endpoint.method} {item.endpoint.url}
              </Typography>
              <Button onClick={() => invoke(item)}>Вызвать</Button>
            </Flow>
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
