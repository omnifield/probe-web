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
import { componentManagerStoreOf, useComponentName } from "../../model";

export function FeedPreset() {
  const store = componentManagerStoreOf(useComponentName());
  const content = store.use((state) => state.content);
  const items = () =>
    (content() ?? []).map((preset) => ({
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
    store.actions.setFeedData(list[0].data);
  });

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        setPresetName(item.value);
        store.actions.setFeedData(item.data);
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
