// ПАНЕЛЬ ВВОДА (PWEB-187/190 продолжение) — выбор заготовки для показанного компонента. Записи
// берутся из `entities/packs` (`PACKS.get(component)`, по схеме `entity/io.ts` каждого
// компонента, `packages/io`'s `exampleOf`), какой компонент показан — из общего стора
// (`entities/preview`, `usePreviewComponent`): у виджета своего доступа к параметру маршрута нет,
// он живёт в постоянном каркасе (`WorkspaceRightbar`), вне `Outlet`.
//
// Выбор пишется В ТОТ ЖЕ стор (`previewStore.trigger.filled`), откуда его читает `ComponentPreview`
// (`usePreviewFill`) — тот же приём, каким `ComponentPreview` отдаёт события наружу в `DataOutput`.
import { createMemo, For, Show } from "solid-js";
import {
  Select,
  SelectClearTrigger,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
  Surface,
} from "@omnifield/probe-web-ui";

import { PACKS } from "#/entities/packs/model/registry.js";
import { previewStore, usePreviewComponent } from "#/entities/preview/model/store.js";

interface FillItem {
  readonly value: string;
  readonly label: string;
}

export function DataInput() {
  const component = usePreviewComponent();

  /** Записи заготовки показанного компонента — нет компонента, нечего листать. */
  const records = createMemo((): readonly unknown[] => {
    const name = component();
    return name === undefined ? [] : (PACKS.get(name) ?? []);
  });

  const items = createMemo((): FillItem[] =>
    records().map((_, index) => ({ value: String(index), label: `Заготовка ${index + 1}` })),
  );

  const onValueChange = (details: { value: string[] }) => {
    const index = details.value[0];
    const record = index === undefined ? undefined : records()[Number(index)];
    previewStore.trigger.filled({ fill: record as Record<string, unknown> | undefined });
  };

  return (
    <Surface>
      <Show
        when={items().length > 0}
        fallback={<p>{component() === undefined ? "Компонент не выбран" : "Заготовок нет"}</p>}
      >
        <Select items={items()} onValueChange={onValueChange}>
          <SelectLabel>Заготовка</SelectLabel>
          <SelectControl>
            <SelectTrigger>
              <SelectValueText placeholder="Выбрать заготовку" />
            </SelectTrigger>
            <SelectClearTrigger>✕</SelectClearTrigger>
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
          <SelectHiddenSelect />
        </Select>
      </Show>
    </Surface>
  );
}
