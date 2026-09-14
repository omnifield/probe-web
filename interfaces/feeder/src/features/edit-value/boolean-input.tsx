import { Checkbox, CheckboxControl, CheckboxIndicator } from "@web-core/ui";

import type { FieldBinding } from "../../entities/tree";

export function BooleanInput(props: { binding: FieldBinding }) {
  return (
    <Checkbox
      checked={props.binding.value() === true}
      onCheckedChange={(details) => props.binding.onChange(details.checked === true)}
    >
      <CheckboxControl>
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxControl>
    </Checkbox>
  );
}
