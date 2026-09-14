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

import { itemBinding, useTree, type FieldBinding } from "../../../entities/tree";
import { Button } from "../../../features/edit-value";

/** Обвязка списка — элементы аккордеоном, у каждого триггер (лейбл + индикатор) и «Убрать» РЯДОМ,
 *  не ВНУТРИ триггера: `AccordionControl` сам `<button>`, кнопка `<button>` внутри нативно ловила
 *  клик как «раскрыть/свернуть» заодно (вложенные `<button>` — невалидный HTML), из-за чего «Убрать»
 *  триггерил аккордеон вместо удаления. «Добавить» сюда не входит — она у поля, рядом с его лейблом
 *  (`node.tsx`), не у списка элементов как такового. Сам не знает, ЧТО рисовать внутри элемента —
 *  зовёт `children(fields, binding, index)` (уже разрешённые на конкретный элемент), обычно это
 *  снова `Node`. */
export function Box(props: {
  field: FieldDescriptor;
  binding: FieldBinding;
  children: (
    fields: readonly FieldDescriptor[],
    binding: FieldBinding,
    index: number,
  ) => JSX.Element;
}) {
  // eslint-disable-next-line solid/reactivity -- field/binding стабильны на весь маунт Box (пересоздаётся ремонтом For, не мутирует на месте)
  const { elementFields, items, indices, removeAt } = useTree(props.field, props.binding);

  return (
    <Accordion collapsible multiple>
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
