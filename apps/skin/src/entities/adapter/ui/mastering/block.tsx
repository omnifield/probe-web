import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { SchemaPane, type SchemaPaneField } from "./pane";

export interface MappingBlockProps {
  readonly title: string;
  readonly componentFields: readonly SchemaPaneField[];
  readonly apiFields: readonly SchemaPaneField[];
}

export function MappingBlock(props: MappingBlockProps) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>{props.title}</Typography>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow data-variant="row">
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <SchemaPane title="Компонент" fields={props.componentFields} empty="нет полей" />
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <SchemaPane title="API" fields={props.apiFields} empty="схема ещё не сохранена" />
          </FlowItem>
        </Flow>
      </FlowItem>
    </Flow>
  );
}
