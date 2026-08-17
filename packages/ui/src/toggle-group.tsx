import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Item as KobalteItem,
  Root as KobalteToggleGroup,
  type ToggleGroupItemProps,
  type ToggleGroupRootProps,
} from "@kobalte/core/toggle-group";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Группа кнопок-переключателей: панель форматирования («Ж К Ч»), набор фильтров-меток.
//
// ## Чем это отличается от `SegmentedControl`, и почему обе нужны
//
// Обе выглядят как ряд кнопок, но говорят разное:
//
//   • `SegmentedControl` — ВЫБОР одного значения из нескольких (`radiogroup`, внутри
//     настоящие `radio`, значение уезжает в форму). «Показывать: список / плитки».
//   • `ToggleGroup` — набор нажатых КНОПОК (`group` + `button[aria-pressed]`), значение в
//     форму не уезжает. Причём нажатых может быть несколько: `multiple`.
//
// Подменить одно другим значит соврать вспомогательной технике: она читает выбор и нажатие
// по-разному. Это то же различие, что между `Switch` и `Toggle`, только для ряда.

/**
 * Пропсы `ToggleGroup` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToggleGroupProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToggleGroupRootProps<T>
>;

/**
 * Корень группы — ОДИН узел `[role=group]` плюс контекст.
 *
 * Держит нажатое (`value` / `defaultValue` / `onChange`), `multiple` и `orientation`. Стрелками
 * по кнопкам ходит kobalte — это поведение группы, а не наша надстройка.
 *
 * @example
 * ```tsx
 * <ToggleGroup multiple value={styles()} onChange={setStyles}>
 *   <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
 *   <ToggleGroupItem value="italic">К</ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
export function ToggleGroup<T extends ValidComponent = "div">(props: ToggleGroupProps<T>) {
  traceLife("ui.toggle-group");

  return <KobalteToggleGroup data-slot="toggle-group" {...(props as ToggleGroupRootProps)} />;
}

/**
 * Пропсы `ToggleGroupItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type ToggleGroupItemComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ToggleGroupItemProps<T>
>;

/**
 * Одна кнопка группы — ОДИН узел `<button aria-pressed>`. Обязателен проп `value`.
 *
 * Нажатость приезжает атрибутом данных (`data-pressed`), как и у одиночного `Toggle`.
 */
export function ToggleGroupItem<T extends ValidComponent = "button">(
  props: ToggleGroupItemComponentProps<T>,
) {
  traceLife("ui.toggle-group-item");

  return <KobalteItem data-slot="toggle-group-item" {...(props as ToggleGroupItemProps)} />;
}
