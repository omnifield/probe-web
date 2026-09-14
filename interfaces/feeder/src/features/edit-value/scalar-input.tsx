import type { FieldDescriptor } from "@web-core/generators/fields";
import { Field, FieldInput } from "@web-core/ui";

import type { FieldBinding } from "../../entities/tree";

export function ScalarInput(props: { field: FieldDescriptor; binding: FieldBinding }) {
  return (
    <Field>
      <FieldInput
        type={props.field.kind === "number" ? "number" : "text"}
        value={(props.binding.value() as string | number | undefined) ?? ""}
        onInput={(event) =>
          props.binding.onChange(
            props.field.kind === "number" ? event.currentTarget.valueAsNumber : event.currentTarget.value,
          )
        }
      />
    </Field>
  );
}
