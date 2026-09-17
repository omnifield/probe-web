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
import {
  ALL_CELLS,
  componentManagerStoreOf,
  useComponentName,
  VIEW_MODES,
  type CellKey,
} from "../../../../model";

export function SwitchViewModeLocal(props: { cell: CellKey }) {
  const store = componentManagerStoreOf(useComponentName());
  const viewMode = store.use(
    (state) => state.viewMode[props.cell] ?? state.viewMode[ALL_CELLS] ?? "form",
  );
  const selected = () => [viewMode()];

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
