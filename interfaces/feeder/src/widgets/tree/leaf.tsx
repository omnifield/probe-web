import { Match, Switch } from "solid-js";
import type { FieldDescriptor } from "@web-core/generators/fields";
import { Typography } from "@web-core/ui";

import type { FieldBinding } from "../../entities/tree";
import { BooleanInput, EnumInput, ScalarInput } from "../../features/edit-value";

export function Leaf(props: { field: FieldDescriptor; binding: FieldBinding }) {
  return (
    <>
      <Typography>{props.field.label}</Typography>
      <Switch fallback={<ScalarInput field={props.field} binding={props.binding} />}>
        <Match when={props.field.kind === "boolean"}>
          <BooleanInput binding={props.binding} />
        </Match>
        <Match when={props.field.kind === "enum"}>
          <EnumInput field={props.field} binding={props.binding} />
        </Match>
      </Switch>
    </>
  );
}
