// Кейсы ввода, волна 2: числовое поле, поиск с подсказками, ползунок, сегментированный выбор,
// группа кнопок.

import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxLabel,
  ComboboxListbox,
  ComboboxPortal,
  ComboboxTrigger,
  NumberField,
  NumberFieldDecrement,
  NumberFieldDescription,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlItemControl,
  SegmentedControlItemInput,
  SegmentedControlItemLabel,
  SegmentedControlLabel,
  SegmentedControlTrack,
  Slider,
  SliderDescription,
  SliderFill,
  SliderInput,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
  ToggleGroup,
  ToggleGroupItem,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import type { Specimen } from "./model.js";

const CITIES = ["Архангельск", "Владивосток", "Мурманск", "Новосибирск", "Хабаровск"];

function OneCombobox(props: { label?: string; disabled?: boolean }) {
  return (
    <Combobox
      options={CITIES}
      disabled={props.disabled}
      placeholder="начните вводить…"
      itemComponent={(itemProps) => (
        <ComboboxItem item={itemProps.item}>
          <ComboboxItemLabel>{itemProps.item.rawValue}</ComboboxItemLabel>
          <ComboboxItemIndicator><span data-icon="check" aria-hidden="true" /></ComboboxItemIndicator>
        </ComboboxItem>
      )}
    >
      <ComboboxLabel>{props.label ?? "Город"}</ComboboxLabel>
      <ComboboxControl>
        <ComboboxInput />
        <ComboboxTrigger>
          <ComboboxIcon><span data-icon="chevron-down" aria-hidden="true" /></ComboboxIcon>
        </ComboboxTrigger>
      </ComboboxControl>
      <ComboboxPortal>
        <ComboboxContent>
          <ComboboxListbox />
        </ComboboxContent>
      </ComboboxPortal>
    </Combobox>
  );
}

function OneSlider(props: { label: string; value?: number; disabled?: boolean }) {
  return (
    <Slider defaultValue={[props.value ?? 40]} disabled={props.disabled}>
      <div class="case__inline case__spread">
        <SliderLabel>{props.label}</SliderLabel>
        <SliderValueLabel />
      </div>
      <SliderTrack>
        <SliderFill />
        <SliderThumb>
          <SliderInput />
        </SliderThumb>
      </SliderTrack>
    </Slider>
  );
}

export const INPUT2_SPECIMENS: Specimen[] = [
  {
    id: "number-field",
    title: "Числовое поле",
    group: "Ввод",
    slots: [
      "number-field",
      "number-field-label",
      "number-field-input",
      "number-field-hidden-input",
      "number-field-increment",
      "number-field-decrement",
      "number-field-description",
      "number-field-error",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        note: "Ввод и кнопки шага — один контрол: рамка на каждом элементе разбила бы его на три. Цифры моноширинные, чтобы разряды не прыгали при шаге.",
        render: () => (
          <div class="case__row">
            <NumberField defaultValue={12}>
              <NumberFieldLabel>Строк на странице</NumberFieldLabel>
              <div class="case__inline">
                <NumberFieldDecrement><span data-icon="minus" aria-hidden="true" /></NumberFieldDecrement>
                <NumberFieldInput />
                <NumberFieldIncrement><span data-icon="plus" aria-hidden="true" /></NumberFieldIncrement>
              </div>
            </NumberField>
          </div>
        ),
      },
      {
        id: "range",
        title: "На границе диапазона",
        note: "Кнопка НЕ отключается на границе — это поведение кита, и оформление не вправе рисовать её отключённой: вид соврал бы. Нажатие просто не меняет значение.",
        render: () => (
          <div class="case__row">
            <NumberField defaultValue={10} minValue={0} maxValue={10}>
              <NumberFieldLabel>Максимум достигнут</NumberFieldLabel>
              <div class="case__inline">
                <NumberFieldDecrement><span data-icon="minus" aria-hidden="true" /></NumberFieldDecrement>
                <NumberFieldInput />
                <NumberFieldIncrement><span data-icon="plus" aria-hidden="true" /></NumberFieldIncrement>
              </div>
              <NumberFieldDescription>Значение от 0 до 10.</NumberFieldDescription>
            </NumberField>
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключено",
        render: () => (
          <div class="case__row">
            <NumberField defaultValue={5} disabled>
              <NumberFieldLabel>Недоступно</NumberFieldLabel>
              <div class="case__inline">
                <NumberFieldDecrement><span data-icon="minus" aria-hidden="true" /></NumberFieldDecrement>
                <NumberFieldInput />
                <NumberFieldIncrement><span data-icon="plus" aria-hidden="true" /></NumberFieldIncrement>
              </div>
            </NumberField>
          </div>
        ),
      },
    ],
  },
  {
    id: "combobox",
    title: "Поиск с подсказками",
    group: "Ввод",
    slots: [
      "combobox",
      "combobox-label",
      "combobox-control",
      "combobox-input",
      "combobox-trigger",
      "combobox-icon",
      "combobox-content",
      "combobox-listbox",
      "combobox-item",
      "combobox-item-label",
      "combobox-item-indicator",
      "combobox-description",
      "combobox-error",
      "combobox-section",
      "combobox-item-description",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Значение НАБИРАЮТ, а набор сужается — этим отличается от списка выбора. Фильтрует компонент сам, второй раз фильтровать не надо.",
        render: () => (
          <div class="case__row">
            <OneCombobox />
          </div>
        ),
      },
      {
        id: "narrow",
        title: "В узкой колонке",
        note: "Рамка на группе, кольцо фокуса тоже: у ввода своё снято, иначе на экране два кольца.",
        render: () => (
          <div class="case__narrow">
            <OneCombobox label="Город доставки" />
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        render: () => (
          <div class="case__row">
            <OneCombobox disabled />
          </div>
        ),
      },
    ],
  },
  {
    id: "slider",
    title: "Ползунок",
    group: "Ввод",
    slots: [
      "slider",
      "slider-label",
      "slider-value-label",
      "slider-track",
      "slider-fill",
      "slider-thumb",
      "slider-input",
      "slider-description",
      "slider-error",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Положение бегунка и длину заливки считает кит — оформление задаёт только форму и цвет. Значение моноширинное: при перетаскивании оно меняется каждый кадр.",
        render: () => (
          <div class="case__stack">
            <OneSlider label="Прозрачность слоя" value={40} />
          </div>
        ),
      },
      {
        id: "values",
        title: "Разные значения",
        note: "Проверка краёв: у нуля заливки не видно, у сотни бегунок не должен выпадать за дорожку.",
        render: () => (
          <div class="case__stack">
            <OneSlider label="Ноль" value={0} />
            <OneSlider label="Половина" value={50} />
            <OneSlider label="Сто" value={100} />
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        note: "Заливка теряет акцент: у отключённого ползунка значение не читается как активное.",
        render: () => (
          <div class="case__stack">
            <Slider defaultValue={[60]} disabled>
              <SliderLabel>Недоступно</SliderLabel>
              <SliderTrack>
                <SliderFill />
                <SliderThumb>
                  <SliderInput />
                </SliderThumb>
              </SliderTrack>
              <SliderDescription>Управление выключено.</SliderDescription>
            </Slider>
          </div>
        ),
      },
    ],
  },
  {
    id: "segmented-control",
    title: "Сегментированный выбор",
    group: "Ввод",
    slots: [
      "segmented-control",
      "segmented-control-label",
      "segmented-control-indicator",
      "segmented-control-item",
      "segmented-control-item-input",
      "segmented-control-item-control",
      "segmented-control-item-label",
      "segmented-control-description",
      "segmented-control-error",
      "segmented-control-track",
      "segmented-control-item-description",
      "segmented-control-item-indicator",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Это ВЫБОР ОДНОГО: внутри настоящие radio, значение уезжает в форму. Поэтому дорожка с подвижной полоской, а не ряд нажатых кнопок.",
        render: () => (
          <div class="case__row">
            <SegmentedControl defaultValue="day">
              <SegmentedControlLabel>Период</SegmentedControlLabel>
              <SegmentedControlTrack>
                <For each={[
                  { v: "day", l: "День" },
                  { v: "week", l: "Неделя" },
                  { v: "month", l: "Месяц" },
                ]}>
                  {(item) => (
                    <SegmentedControlItem value={item.v}>
                      <SegmentedControlItemInput />
                      <SegmentedControlItemControl>
                        <SegmentedControlItemLabel>{item.l}</SegmentedControlItemLabel>
                      </SegmentedControlItemControl>
                    </SegmentedControlItem>
                  )}
                </For>
                {/* Полоска ставится ПОСЛЕ сегментов: кит измеряет активный и переносит её на
                    его место. Дорожка (`SegmentedControlTrack`) даёт ей систему координат — до
                    появления этой зацепки полоска съезжала. */}
                <SegmentedControlIndicator />
              </SegmentedControlTrack>
            </SegmentedControl>
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        render: () => (
          <div class="case__row">
            <SegmentedControl defaultValue="week" disabled>
              <SegmentedControlLabel>Недоступно</SegmentedControlLabel>
              <SegmentedControlTrack>
                <For each={[{ v: "day", l: "День" }, { v: "week", l: "Неделя" }]}>
                  {(item) => (
                    <SegmentedControlItem value={item.v}>
                      <SegmentedControlItemInput />
                      <SegmentedControlItemControl>
                        <SegmentedControlItemLabel>{item.l}</SegmentedControlItemLabel>
                      </SegmentedControlItemControl>
                    </SegmentedControlItem>
                  )}
                </For>
                <SegmentedControlIndicator />
              </SegmentedControlTrack>
            </SegmentedControl>
          </div>
        ),
      },
    ],
  },
  {
    id: "toggle-group",
    title: "Группа кнопок",
    group: "Действия",
    slots: ["toggle-group", "toggle-group-item"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Независимые кнопки: нажатых может быть несколько, значение в форму не уезжает. Вид берётся из правил кнопки-переключателя одним источником.",
        render: () => (
          <div class="case__row">
            <ToggleGroup multiple defaultValue={["bold"]}>
              <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
              <ToggleGroupItem value="italic">К</ToggleGroupItem>
              <ToggleGroupItem value="underline">Ч</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ),
      },
      {
        id: "single",
        title: "Только одно нажатие",
        note: "Тот же примитив в режиме одиночного выбора — поведение задаёт потребитель, вид не меняется.",
        render: () => (
          <div class="case__row">
            <ToggleGroup defaultValue="left">
              <ToggleGroupItem value="left">По левому</ToggleGroupItem>
              <ToggleGroupItem value="center">По центру</ToggleGroupItem>
              <ToggleGroupItem value="right">По правому</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ),
      },
    ],
  },
];
