import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { For, Show } from "solid-js";

export interface SchemaPaneField {
  readonly path: string;
  readonly type: string;
}

export interface SchemaPaneProps {
  readonly title: string;
  readonly fields: readonly SchemaPaneField[];
  readonly empty: string;
}

export function SchemaPane(props: SchemaPaneProps) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>{props.title}</Typography>
      </FlowItem>
      <Show when={props.fields.length > 0} fallback={<FlowItem><Typography>{props.empty}</Typography></FlowItem>}>
        <For each={props.fields}>
          {(field) => (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Typography>
                {field.path} — {field.type}
              </Typography>
            </FlowItem>
          )}
        </For>
      </Show>
    </Flow>
  );
}
