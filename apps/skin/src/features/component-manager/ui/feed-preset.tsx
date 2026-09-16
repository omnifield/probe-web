import { createEffect, createSignal, For } from "solid-js";
import {
  Select,
  SelectLabel,
  SelectControl,
  SelectTrigger,
  SelectValueText,
  SelectIndicator,
  SelectPositioner,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "@web-core/ui";

import { contentQuery } from "#/entities/component";
import { componentManagerStore } from "../model";

export function FeedPreset(props: { component?: string }) {
  const query = contentQuery.use(() => props.component ?? "");
  const items = () =>
    (query.data ?? []).map((preset) => ({
      value: preset.name,
      label: preset.label,
      data: preset.state.data,
    }));

  const [selected, setSelected] = createSignal<string[]>([]);

  createEffect(() => {
    props.component;
    setSelected([]);
  });

  createEffect(() => {
    const [first] = items();
    if (first !== undefined && selected().length === 0) {
      setSelected([first.value]);
      componentManagerStore.actions.setFeedData(first.data);
    }
  });

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        setSelected(details.value);
        componentManagerStore.actions.setFeedData(details.items[0]?.data);
      }}
    >
      <SelectLabel>Пресет</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выберите пресет" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={items()}>
            {(item) => (
              <SelectItem item={item}>
                <SelectItemText>{item.label}</SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
