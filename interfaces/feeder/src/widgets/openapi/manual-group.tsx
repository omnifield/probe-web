import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { For } from "solid-js";

import { descriptorToEndpoint, manualGroupSchema, type EndpointDescriptor, type ManualGroupValue, type OpenapiEndpoint } from "../../entities/openapi/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";
import { Tree } from "../tree/index.js";
import { EndpointCard } from "./endpoint-card.js";

/** Тело группы-юзера — сама структура ручек (`method`/`url`/`params`) заполняется через `Tree`
 *  (мод 1) поверх `manualGroupSchema`: add/remove ручки и параметра внутри — уже готовая механика
 *  списков мода 1, здесь ничего своего не изобретается. Каждый заполненный дескриптор параллельно
 *  рендерится `EndpointCard` — конфигурация ЗНАЧЕНИЙ вызова и сама кнопка «Отправить», та же
 *  карточка, что у группы-схемы (мод 2 не знает, откуда взялся `OpenapiEndpoint`). */
export function ManualGroupEditor(props: {
  endpoints: readonly EndpointDescriptor[];
  onEndpointsChange: (endpoints: readonly EndpointDescriptor[]) => void;
  onInvoke: (endpoint: OpenapiEndpoint, value: unknown, response: InvokeResult) => void;
}) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Tree
          schema={manualGroupSchema}
          value={{ endpoints: props.endpoints } satisfies ManualGroupValue}
          onChange={(value) => props.onEndpointsChange((value as ManualGroupValue).endpoints)}
        />
      </FlowItem>
      <For each={props.endpoints}>
        {(descriptor) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <EndpointCard
              endpoint={descriptorToEndpoint(descriptor)}
              onInvoke={(value, response) => props.onInvoke(descriptorToEndpoint(descriptor), value, response)}
            />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
