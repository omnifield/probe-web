import {
  Button,
  Field,
  FieldInput,
  FieldLabel,
  FieldTextarea,
  Flow,
  FlowItem,
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { createMemo, For, Show } from "solid-js";

import { callEndpoint, HTTP_METHODS, methodHasBody, saveSchema, type Endpoint, type HttpMethod } from "../../model";
import { HeadersField } from "./headers";

export interface EndpointFormProps {
  readonly endpoint: Endpoint;
  readonly onChangeMethod: (method: HttpMethod) => void;
  readonly onChangeUrl: (url: string) => void;
  readonly onChangeBody: (body: string) => void;
  readonly onChangeHeaders: (headers: Endpoint["headers"]) => void;
}

export function EndpointForm(props: EndpointFormProps) {
  const methodOptions = createMemo(() => HTTP_METHODS.map((method) => ({ value: method, label: method })));
  const methodValue = createMemo(() => [props.endpoint.method]);

  const send = async () => {
    try {
      const result = await callEndpoint(props.endpoint);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };

  const saveAsSchema = async () => {
    try {
      const result = await callEndpoint(props.endpoint);
      console.log(result);
      console.log(saveSchema(props.endpoint.id, result.body));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Field>
          <FieldLabel>Метод</FieldLabel>
          <Select
            items={methodOptions()}
            value={methodValue()}
            onValueChange={(details) => props.onChangeMethod(details.value[0] as HttpMethod)}
          >
            <SelectControl>
              <SelectTrigger>
                <SelectValueText />
              </SelectTrigger>
              <SelectIndicator>▾</SelectIndicator>
            </SelectControl>
            <SelectPositioner>
              <SelectContent>
                <For each={methodOptions()}>
                  {(item) => (
                    <SelectItem item={item}>
                      <SelectItemText>{item.label}</SelectItemText>
                      <SelectItemIndicator>✓</SelectItemIndicator>
                    </SelectItem>
                  )}
                </For>
              </SelectContent>
            </SelectPositioner>
            <SelectHiddenSelect />
          </Select>
        </Field>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Field>
          <FieldLabel>Адрес</FieldLabel>
          <FieldInput
            placeholder="https://api.example.com/items"
            value={props.endpoint.url}
            onInput={(event) => props.onChangeUrl(event.currentTarget.value)}
          />
        </Field>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <HeadersField
          headers={props.endpoint.headers}
          onChange={props.onChangeHeaders}
          actions={
            <>
              <Button onClick={send}>Отправить запрос</Button>
              <Button onClick={saveAsSchema}>Сохранить как схему</Button>
            </>
          }
        />
      </FlowItem>
      <Show when={methodHasBody(props.endpoint.method)}>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Field>
            <FieldLabel>Тело</FieldLabel>
            <FieldTextarea
              placeholder="{}"
              value={props.endpoint.body}
              onInput={(event) => props.onChangeBody(event.currentTarget.value)}
            />
          </Field>
        </FlowItem>
      </Show>
    </Flow>
  );
}
