import { For, Match, Switch } from "solid-js";
import {
  type FieldDescriptor,
  valueAt,
  withValue,
} from "@web-core/generators/fields";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Icon, Typography } from "@web-core/ui";
import type { FieldBinding } from "../../../lib/binding";
import { useTree } from "../../../lib/use-tree";
import { Button } from "../../kit";
import { Leaf } from "../leaf";
import { Box } from "./box";

/** Один узел дерева настроек — принимает СПИСОК полей (`fields`) и `binding`, на котором они
 *  сидят: корень схемы (`root.tsx`, `fieldsOf`) и один элемент списка (свои поля, `fieldsOfElement`)
 *  — тот же самый вызов, без отдельной ветки под каждый случай, структурно нода одинакова на всех
 *  уровнях. Единственный цикл здесь — по `fields`; поле `kind: "list"` рисует «Добавить» рядом со
 *  своим лейблом (у поля, не у списка элементов — та часть у {@link Box}) и отдаёт элементы `Box`,
 *  рекурсируя саму `Node` на каждый (глубина внутрь идёт рекурсией, не вторым циклом в этом же
 *  теле), любое другое поле — рисует `Leaf`. */
export function Node(props: {
  fields: readonly FieldDescriptor[];
  binding: FieldBinding;
}) {
  return (
    <Flow data-variant="column-center">
      <For each={props.fields}>
        {(field) => {
          const binding: FieldBinding = {
            value: () => valueAt(props.binding.value(), field.path),
            onChange: (value) =>
              props.binding.onChange(
                withValue(props.binding.value(), field.path, value),
              ),
          };

          const { add } = useTree(field, binding);

          return (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Switch fallback={<Leaf field={field} binding={binding} />}>
                <Match when={field.kind === "list"}>
                  <Flow data-variant="column-center">
                    <FlowItem style={layoutSelf({ align: "stretch" })}>
                      <Flow
                        style={{
                          ...layoutGroup({
                            justify: "space-between",
                            align: "center",
                          }),
                          ...layoutSelf({ align: "stretch" }),
                        }}
                      >
                        <Typography>{field.label}</Typography>
                        <Button
                          data-variant="tertiary"
                          onClick={add}
                          aria-label="Добавить"
                        >
                          <Icon name="plus" />
                        </Button>
                      </Flow>
                    </FlowItem>
                    <FlowItem style={layoutSelf({ align: "stretch" })}>
                      <Box field={field} binding={binding}>
                        {(fields, itemBinding) => (
                          <Node fields={fields} binding={itemBinding} />
                        )}
                      </Box>
                    </FlowItem>
                  </Flow>
                </Match>
              </Switch>
            </FlowItem>
          );
        }}
      </For>
    </Flow>
  );
}
