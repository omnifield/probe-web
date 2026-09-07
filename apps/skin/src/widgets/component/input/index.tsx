import {
  Button,
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
  Surface,
} from "@web-core/ui";
import { createEffect, createMemo, createResource, For } from "solid-js";

import { componentHandle, listContentFor } from "#/entities/component";

interface ContentItem {
  readonly value: string;
  readonly label: string;
}

export function Input() {
  const component = componentHandle();

  createEffect(() => {
    if (!component.ready()) return;
    component.generate();
  });

  // Второй источник данных показа, рядом с зодером — пока оба живут рядом (зодер остаётся
  // дефолтом, выпиливание — отдельная будущая задача). Записей нет — выпадашка пустая/дизейблена,
  // без ошибки: `records()` из createResource — просто undefined, пока не пришло.
  const [records] = createResource(() => component.info()?.component, listContentFor);
  const items = createMemo(
    (): ContentItem[] => (records() ?? []).map((record) => ({ value: record.id, label: record.label })),
  );

  const onValueChange = (details: { value: string[] }) => {
    const id = details.value[0];
    const record = records()?.find((candidate) => candidate.id === id);
    if (record) component.setData(record.state.data);
  };

  return (
    <Surface>
      <Button onClick={component.generate} disabled={!component.ready()}>
        GENERATE FAKE DATA
      </Button>

      <Select items={items()} onValueChange={onValueChange} disabled={items().length === 0}>
        <SelectControl>
          <SelectTrigger>
            <SelectValueText placeholder="Наши данные" />
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
        <SelectHiddenSelect />
      </Select>
    </Surface>
  );
}
