// Кейсы ввода: поле и список выбора.

import {
  Field,
  FieldDescription,
  FieldError,
  Input,
  Label,
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@omnifield/probe-web-ui";
import { createSignal, untrack } from "solid-js";

import type { Specimen } from "./model.js";

const FRUITS = ["Яблоко", "Груша", "Слива", "Абрикос"];
const CITIES = [
  "Архангельск",
  "Владивосток",
  "Екатеринбург",
  "Калининград",
  "Красноярск",
  "Мурманск",
  "Новосибирск",
  "Петропавловск-Камчатский",
  "Ростов-на-Дону",
  "Хабаровск",
];

function OneSelect(props: { options?: string[]; disabled?: boolean; long?: boolean }) {
  // `options` — функция, а не снятое значение: `props` реактивны (правило `solid/reactivity`).
  const options = () => props.options ?? FRUITS;

  // Начальное значение читается ОДИН раз — это и требуется, поэтому чтение обёрнуто в
  // `untrack`: без него линтер справедливо считает, что мы забыли про реактивность.
  const [value, setValue] = createSignal<string | null>(
    untrack(() => (props.long ? "Петропавловск-Камчатский" : (options()[0] ?? null))),
  );

  return (
    <Select
      value={value()}
      onChange={setValue}
      options={options()}
      disabled={props.disabled}
      placeholder="Выберите…"
      itemComponent={(itemProps) => (
        <SelectItem item={itemProps.item}>
          <SelectItemLabel>{itemProps.item.rawValue}</SelectItemLabel>
          <SelectItemIndicator />
        </SelectItem>
      )}
    >
      <SelectTrigger aria-label="Значение">
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <SelectListbox />
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}

export const FORM_SPECIMENS: Specimen[] = [
  {
    id: "field",
    title: "Поле",
    slots: ["field", "label", "input", "textarea", "field-description", "field-error"],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        render: () => (
          <div class="case__grid">
            <Field>
              <Label>Имя набора</Label>
              <Input placeholder="например, продажи за квартал" />
            </Field>
          </div>
        ),
      },
      {
        id: "description",
        title: "С пояснением",
        note: "Пояснение тише подписи и стоит под полем — читается как примечание, а не как второй ярлык.",
        render: () => (
          <div class="case__grid">
            <Field>
              <Label>Имя набора</Label>
              <Input placeholder="продажи за квартал" />
              <FieldDescription>Короткое имя, по которому набор виден в списке.</FieldDescription>
            </Field>
          </div>
        ),
      },
      {
        id: "invalid",
        title: "Недопустимое значение",
        note: "Рамка уходит в цвет ошибки И появляется текст: цвет не единственный носитель смысла.",
        render: () => (
          <div class="case__grid">
            <Field validationState="invalid">
              <Label>Адрес службы</Label>
              <Input value="ht!tp://" />
              <FieldError>Адрес не разобран — проверьте схему.</FieldError>
            </Field>
          </div>
        ),
      },
      {
        id: "states",
        title: "Отключено и только чтение",
        note: "Разные состояния с похожим видом: отключённое недоступно, «только чтение» можно выделить и скопировать.",
        render: () => (
          <div class="case__grid">
            <Field disabled>
              <Label>Ключ доступа</Label>
              <Input value="выдаётся администратором" />
            </Field>
            <Field readOnly>
              <Label>Владелец</Label>
              <Input value="owner-skin" />
            </Field>
          </div>
        ),
      },
      {
        id: "textarea",
        title: "Многострочное",
        note: "Высота выведена из высоты контрола, поэтому плотный режим сжимает и её.",
        render: () => (
          <div class="case__grid">
            <Field>
              <Label>Заметка</Label>
              <Textarea placeholder="необязательно" />
            </Field>
          </div>
        ),
      },
      {
        id: "narrow",
        title: "В узкой колонке",
        note: "Проверка, что подпись не рвётся, а плейсхолдер обрезается многоточием, а не выпирает.",
        render: () => (
          <div class="case__narrow">
            <Field>
              <Label>Имя набора</Label>
              <Input placeholder="например, продажи за квартал и ещё немного" />
            </Field>
          </div>
        ),
      },
    ],
  },
  {
    id: "select",
    title: "Список выбора",
    slots: [
      "select",
      "select-trigger",
      "select-value",
      "select-icon",
      "select-content",
      "select-listbox",
      "select-item",
      "select-item-label",
      "select-item-indicator",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Панель по ширине кнопки — этим считает позиционировщик, не оформление.",
        render: () => (
          <div class="case__row">
            <OneSelect />
          </div>
        ),
      },
      {
        id: "many",
        title: "Длинный список",
        note: "Потолок высоты — меньшее из шести строк и свободного места на экране; дальше прокрутка.",
        render: () => (
          <div class="case__row">
            <OneSelect options={CITIES} />
          </div>
        ),
      },
      {
        id: "long-value",
        title: "Длинное значение",
        note: "Значение обрезается многоточием, значок остаётся на месте и не уезжает за край.",
        render: () => (
          <div class="case__narrow">
            <OneSelect options={CITIES} long />
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        render: () => (
          <div class="case__row">
            <OneSelect disabled />
          </div>
        ),
      },
      {
        id: "in-form",
        title: "Рядом с полем",
        note: "Высоты кнопки списка и поля обязаны совпадать — обе берут --control-height-md.",
        render: () => (
          <div class="case__grid">
            <Field>
              <Label>Город</Label>
              <Input value="Мурманск" />
            </Field>
            <Field>
              <Label>Плод</Label>
              <OneSelect />
            </Field>
          </div>
        ),
      },
    ],
  },
];
