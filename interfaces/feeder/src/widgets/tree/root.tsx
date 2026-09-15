import { createMemo } from "solid-js";
import { fieldsOf, type FieldDescriptor } from "@web-core/generators/fields";
import type { z } from "@web-core/io";

import type { FieldBinding } from "../../entities/tree";
import { Node } from "./node";

export function Tree(props: {
  schema: z.ZodType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const fields = createMemo<readonly FieldDescriptor[]>(() =>
    fieldsOf(props.schema),
  );

  const binding: FieldBinding = {
    value: () => props.value ?? {},
    onChange: (value) => props.onChange(value),
  };

  return <Node fields={fields()} binding={binding} />;
}
