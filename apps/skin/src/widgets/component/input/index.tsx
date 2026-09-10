import {
  Flow,
  FlowItem,
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
import { layoutSelf } from "@web-core/skin";
import { createEffect, createMemo, createResource, createSignal, For } from "solid-js";

import { componentHandle, listContentFor } from "#/entities/component";

import { DataFields } from "./fields";
import { fieldsOf, withValue, type FieldPath } from "./schema";

const MOCK_DATA = "-мок-";

interface ContentItem {
  readonly value: string;
  readonly label: string;
}

export function Input() {
  const component = componentHandle();

  // Единственный источник данных показа — сохранённый content. Записей нет — выпадашка
  // пустая/дизейблена, без ошибки: `records.latest` — просто undefined, пока не пришло.
  //
  // `.latest`, НЕ вызов `records()`: TanStack Router оборачивает КАЖДОЕ совпадение маршрута в свой
  // `<Suspense>` (`Match.js`) — `Input` рендерится внутри `WorkspaceLayout`, а он и есть
  // `component` маршрута `_workspace`, значит эта граница накрывает хедер/сайдбар/чат/витрину
  // разом. Чтение `records()` во время повторной загрузки (переключение компонента в дереве —
  // новый `component.info()?.component`) подвешивает ближайший `<Suspense>` — весь `WorkspaceLayout`
  // на миг проваливается в пустой fallback. `.latest` отдаёт последнее известное значение без
  // подписки на приостановку границы — тот же приём, каким `componentInfoAtom` (свой
  // `createResourceAtom`, не интегрирован с Suspense) уже не мигает.
  const [records] = createResource(() => component.info()?.component, listContentFor);
  const items = createMemo(
    (): ContentItem[] => (records.latest ?? []).map((record) => ({ value: record.id, label: record.label })),
  );

  const [selected, setSelected] = createSignal<string[]>([]);

  // Селект — контролируемый: сам Ark не сбрасывает выбор при смене `items` (список пунктов
  // сменился — предыдущий id ему не принадлежит, но подпись на триггере осталась бы старой).
  // Тот же эффект решает дефолт: пункт 0 есть — сразу его, списка нет — мок вместо пустоты.
  createEffect(() => {
    const list = items();
    const first = list[0];
    if (!first) {
      setSelected([]);
      component.setData(MOCK_DATA);
      return;
    }

    setSelected([first.value]);
    const record = records.latest?.find((candidate) => candidate.id === first.value);
    if (record) component.setData(record.state.data);
  });

  const onValueChange = (details: { value: string[] }) => {
    const id = details.value[0];
    const record = records()?.find((candidate) => candidate.id === id);
    setSelected(details.value);
    if (record) component.setData(record.state.data);
  };

  // Поля выбранного набора, по io-схеме — первый заход `input-widget-real-ui`: скаляры верхнего
  // уровня и одного уровня вложенности, массивы не рендерятся (см. `schema.ts`). Правка кладётся
  // ПОВЕРХ того, что уже лежит в `componentDataAtom` (`component.data()`), не поверх записи из
  // `records` — так правки не теряются при повторном рендере до следующего выбора набора.
  const fields = createMemo(() => {
    const schema = component.info()?.io?.schema;
    return schema ? fieldsOf(schema) : [];
  });

  const onFieldChange = (path: FieldPath, value: unknown) => {
    component.setData(withValue(component.data(), path, value));
  };

  return (
    <Surface>
      <Flow data-variant="column-center">
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Select
            items={items()}
            value={selected()}
            onValueChange={onValueChange}
            disabled={items().length === 0}
          >
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
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <DataFields fields={fields()} data={component.data()} onChange={onFieldChange} />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
