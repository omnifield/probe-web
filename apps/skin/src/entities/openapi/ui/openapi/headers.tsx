import { Button, Field, FieldInput, Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { Index, Show, type JSX } from "solid-js";

import type { EndpointHeader } from "../../model";

export interface HeadersFieldProps {
  readonly headers: readonly EndpointHeader[];
  readonly onChange: (headers: readonly EndpointHeader[]) => void;
  readonly actions?: JSX.Element;
}

export function HeadersField(props: HeadersFieldProps) {
  const setAt = (index: number, patch: Partial<EndpointHeader>) =>
    props.onChange(props.headers.map((header, i) => (i === index ? { ...header, ...patch } : header)));

  const removeAt = (index: number) => props.onChange(props.headers.filter((_, i) => i !== index));

  const add = () => props.onChange([...props.headers, { key: "", value: "" }]);

  return (
    <Flow data-variant="column-center">
      <Index each={props.headers}>
        {(header, index) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Flow data-variant="row">
              <FlowItem style={layoutSelf({ align: "stretch" })}>
                <Field>
                  <FieldInput
                    placeholder="Header"
                    value={header().key}
                    onInput={(event) => setAt(index, { key: event.currentTarget.value })}
                  />
                </Field>
              </FlowItem>
              <FlowItem style={layoutSelf({ align: "stretch" })}>
                <Field>
                  <FieldInput
                    placeholder="Value"
                    value={header().value}
                    onInput={(event) => setAt(index, { value: event.currentTarget.value })}
                  />
                </Field>
              </FlowItem>
              <FlowItem>
                <Button onClick={() => removeAt(index)}>Удалить</Button>
              </FlowItem>
            </Flow>
          </FlowItem>
        )}
      </Index>
      <Show when={props.actions}>
        <FlowItem style={layoutSelf({ align: "stretch" })}>{props.actions}</FlowItem>
      </Show>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button onClick={add}>Добавить хедер</Button>
      </FlowItem>
    </Flow>
  );
}
