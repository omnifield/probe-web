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

type SecondaryItem = { readonly name: string };

/** Выбор secondary-элемента для `cell`. Один и тот же контрол для grid и matrix — куда именно
 *  пишется выбор (на саму ячейку или на всю её группу), решает стор по `layoutMode`
 *  (`secondaryScopeOf` в `model/store.ts`), контрол этого не знает и знать не должен. */
export function SwitchSecondaryIndex(props: {
  cell: Cell;
  items: readonly SecondaryItem[];
}) {
  const store = componentManagerStoreOf(useComponentName());

  const options = () =>
    props.items.map((item, index) => ({ value: String(index), label: item.name }));

  const index = () => store.selectors.secondaryIndex(props.cell);
  const selected = () => {
    const item = options()[index()];
    return item === undefined ? [] : [item.value];
  };

  return (
    <Select
      items={options()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        store.actions.setSecondaryIndex(Number(item.value), props.cell);
      }}
    >
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выбрать" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={options()}>
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
