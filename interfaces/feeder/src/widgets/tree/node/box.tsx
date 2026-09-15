import { For, type JSX } from "solid-js";
import type { FieldDescriptor } from "@web-core/generators/fields";
import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Flow,
  Icon,
  Surface,
  Typography,
  FlowItem,
} from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import {
  itemBinding,
  useTree,
  type FieldBinding,
} from "../../../entities/tree";
import { Button } from "../../../features/edit-value";

export function Box(props: {
  field: FieldDescriptor;
  binding: FieldBinding;
  children: (
    fields: readonly FieldDescriptor[],
    binding: FieldBinding,
    index: number,
  ) => JSX.Element;
}) {
  /* eslint-disable solid/reactivity -- field/binding стабильны на весь маунт Box (пересоздаётся ремонтом For, не мутирует на месте) */
  const { elementFields, items, indices, removeAt } = useTree(
    props.field,
    props.binding,
  );

  return (
    <Accordion collapsible multiple data-variant="cards">
      <For each={indices()}>
        {(index) => (
          <AccordionItem value={String(index)}>
            <Flow>
              <FlowItem style={layoutSelf({ align: "stretch" })}>
                <AccordionControl>
                  <Typography>
                    {props.field.label} #{index + 1}
                  </Typography>
                  <Button
                    data-variant="error-quiet"
                    onClick={() => removeAt(index)}
                    aria-label="Убрать"
                  >
                    <Icon name="trash" />
                  </Button>
                  <AccordionControlIndicator>▾</AccordionControlIndicator>
                </AccordionControl>
              </FlowItem>
            </Flow>
            <AccordionContent>
              <Surface>
                {props.children(
                  elementFields(),
                  itemBinding(props.binding, items, index),
                  index,
                )}
              </Surface>
            </AccordionContent>
          </AccordionItem>
        )}
      </For>
    </Accordion>
  );
}
