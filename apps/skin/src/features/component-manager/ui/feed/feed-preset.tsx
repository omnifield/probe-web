import { createEffect, createSignal, For } from "solid-js";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";
import { contentOf } from "#/entities/component";

export function FeedPreset(props: {
  component?: string;
  onChange?: (data: unknown) => void;
}) {
  const query = contentOf.use(() => props.component ?? "");
  const items = () =>
    (query.data ?? []).map((preset) => ({
      value: preset.name,
      label: preset.label,
      data: preset.state.data,
    }));

  const [presetName, setPresetName] = createSignal<string>();
  const selected = () => {
    const name = presetName();
    return name === undefined ? [] : [name];
  };

  createEffect(() => {
    const list = items();
    if (list.length === 0) return;

    const current = presetName();
    if (list.some((item) => item.value === current)) return;

    setPresetName(list[0].value);
    props.onChange?.(list[0].data);
  });

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        setPresetName(item.value);
        props.onChange?.(item.data);
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
