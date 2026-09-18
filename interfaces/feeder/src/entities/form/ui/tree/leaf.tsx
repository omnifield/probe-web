import { Match, Switch } from "solid-js";
import type { FieldDescriptor } from "@web-core/generators/fields";
import { Typography } from "@web-core/ui";

import type { FieldBinding } from "../../lib/index.js";
import {
  BooleanInput,
  EnumInput,
  ScalarInput,
} from "../kit/index.js";

export function Leaf(props: { field: FieldDescriptor; binding: FieldBinding }) {
  return (
    <>
      <Typography>{props.field.label}</Typography>
      <Switch
        fallback={<ScalarInput field={props.field} binding={props.binding} />}
      >
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
