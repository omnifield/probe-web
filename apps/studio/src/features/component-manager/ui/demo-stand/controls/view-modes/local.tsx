import {
  Icon,
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
import { For } from "solid-js";
import type { Cell } from "../../../../lib/cell";
import { componentManagerStoreOf, useComponentName, VIEW_MODES } from "../../../../model";

export function SwitchViewModeLocal(props: { cell: Cell }) {
  const store = componentManagerStoreOf(useComponentName());
  const selected = () => [store.selectors.viewMode(props.cell)];

  return (
    <Select
      items={VIEW_MODES}
      value={selected()}
      onValueChange={(details) => {
        const mode = details.items[0];
        if (mode === undefined) return;
        store.actions.setViewMode(mode.value, props.cell);
      }}
    >
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Вид" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={VIEW_MODES}>
            {(mode) => (
              <SelectItem item={mode}>
                <SelectItemText>
                  <Icon name={mode.icon} />
                  {mode.value}
                </SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
