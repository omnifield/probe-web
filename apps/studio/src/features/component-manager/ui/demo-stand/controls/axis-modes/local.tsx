import { For } from "solid-js";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";
import type { Cell } from "../../../../lib/cell";
import { componentManagerStoreOf, useComponentName } from "../../../../model";

export function SwitchAxisModeLocal(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());
  const axisMode = store.use((state) => state.axisMode);
  const variants = store.use((state) => state.variants ?? []);
  const assemblies = store.use((state) => state.editorInfo?.assemblies ?? []);

  const names = () => (axisMode() === "variant" ? assemblies() : variants()).map((item) => item.name);
  const items = () => names().map((name, index) => ({ value: String(index), label: name }));

  const index = () => store.selectors.secondaryIndex(props.cell);
  const selected = () => {
    const item = items()[index()];
    return item === undefined ? [] : [item.value];
  };

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        store.actions.setSecondaryIndex(Number(item.value), props.cell);
      }}
    >
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder={axisMode() === "variant" ? "Сборка" : "Вариант"} />
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
