import { createMemo, For } from "solid-js";
import type { FieldDescriptor } from "@web-core/generators/fields";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

import type { FieldBinding } from "../../entities/tree";

export function EnumInput(props: { field: FieldDescriptor; binding: FieldBinding }) {
  const options = createMemo(() => (props.field.options ?? []).map((value) => ({ value, label: value })));
  const value = createMemo(() => (typeof props.binding.value() === "string" ? [props.binding.value() as string] : []));

  return (
    <Select items={options()} value={value()} onValueChange={(details) => props.binding.onChange(details.value[0])}>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выбрать" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={options()}>
            {(option) => (
              <SelectItem item={option}>
                <SelectItemText>{option.label}</SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
      <SelectHiddenSelect />
    </Select>
  );
}
