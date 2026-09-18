import { Field, FieldTextarea, Flow, FlowItem } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";

import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { Button } from "../../features/edit-value/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";
import { SchemaGroupView } from "./schema-group.js";

/** Группа-схема целиком: raw редактируется прямо тут (правка = «обновить», перезалить документ и
 *  переразобрать заново — состав read-only, поштучно ручки не правятся). «Очистить» ничего не
 *  «переключает» — это просто `onRawChange("")`; группа сама вернётся в нейтральное состояние, как
 *  только `raw` опустеет (`openapiGroupKind`, см. types.ts) — здесь нет отдельного флага, который
 *  надо было бы сбрасывать отдельным действием. Список ручек — прежнее тело `SchemaGroupView`,
 *  распознавание не меняется. */
export function SchemaGroupEditor(props: {
  raw: string;
  onRawChange: (raw: string) => void;
  onInvoke: (endpoint: OpenapiEndpoint, value: unknown, response: InvokeResult) => void;
}) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow style={layoutGroup({ align: "stretch" })}>
          <Field>
            <FieldTextarea value={props.raw} onInput={(event) => props.onRawChange(event.currentTarget.value)} />
          </Field>
          <Button data-variant="error-quiet" onClick={() => props.onRawChange("")}>
            Очистить
          </Button>
        </Flow>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <SchemaGroupView raw={props.raw} onInvoke={props.onInvoke} />
      </FlowItem>
    </Flow>
  );
}
