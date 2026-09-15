import { run } from "@web-core/generators/mapping";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { createResource, For, Show } from "solid-js";

import { swagger2Template } from "../../entities/openapi/index.js";
import { EndpointCard } from "./endpoint-card.js";
import type { OpenapiInvocation } from "./types.js";

/** Полный вид мода 2 — экран редактора: вход — сырой текст Swagger 2.0 (жёсткое совпадение, другой
 *  формат/версия — отклоняется, см. `entities/openapi`). Список ручек, конфигурация параметров
 *  каждой — `EndpointCard` (та же машинерия `Node`, что у мода 1, но локально карточке). `onChange`
 *  стреляет НЕ на правку поля (как `Tree`), а когда юзер реально дёргает ручку — несёт
 *  `{ endpoint, value, response }` — сохранённая пара `{ endpoint, value }` и есть готовый айтем
 *  для `OpenapiList`, компактного вида без редактирования. */
export function OpenapiEditor(props: { raw: string; onChange: (invocation: OpenapiInvocation) => void }) {
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
            <EndpointCard
              endpoint={endpoint}
              onInvoke={(value, response) => props.onChange({ endpoint, value, response })}
            />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
