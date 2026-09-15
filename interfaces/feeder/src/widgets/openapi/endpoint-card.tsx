import { fieldsOf } from "@web-core/generators/fields";
import { Flow, FlowItem, Surface, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { createMemo, createSignal } from "solid-js";

import type { FieldBinding } from "../../entities/tree/index.js";
import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { Button } from "../../features/edit-value/index.js";
import { invokeEndpoint, type InvokeResult } from "../../features/invoke-endpoint/index.js";
import { Node } from "../tree/node/index.js";

/** Одна ручка — конфигурация параметров той же машинерией, что мод 1 (`Node`+`fieldsOf`), но
 *  значение локально карточке, наружу не течёт на каждую правку. Наружу (`onInvoke`) идёт только
 *  по кнопке «Отправить» — вместе с тем, с чем звали (`value`), и самим ответом. */
export function EndpointCard(props: {
  endpoint: OpenapiEndpoint;
  onInvoke: (value: unknown, response: InvokeResult) => void;
}) {
  const [value, setValue] = createSignal<unknown>({});
  const [status, setStatus] = createSignal<string>();
  const fields = createMemo(() => fieldsOf(props.endpoint.schema));

  const binding: FieldBinding = {
    value: () => value() ?? {},
    onChange: setValue,
  };

  async function invoke() {
    const response = await invokeEndpoint(props.endpoint, value());
    setStatus(`${response.status} ${response.ok ? "OK" : "ERROR"}`);
    props.onInvoke(value(), response);
  }

  return (
    <Surface>
      <Flow data-variant="column-center">
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Typography>
            {props.endpoint.method} {props.endpoint.url}
          </Typography>
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Node fields={fields()} binding={binding} />
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Button onClick={invoke}>Отправить</Button>
          {status() !== undefined && <Typography>{status()}</Typography>}
        </FlowItem>
      </Flow>
    </Surface>
  );
}
