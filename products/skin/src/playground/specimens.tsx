// Образцы примитивов — то, что показывается в сетке стенда.
//
// Разделены по примитиву, а не по странице: вкладка «Всё» показывает те же секции подряд, и
// второго источника правды не заводится.
//
// ЧЕСТНАЯ ГРАНИЦА: наведение и фокус здесь НЕ подделываются классом-имитацией. Их нельзя
// вызвать из разметки, и нарисованная «как бы наведённая» кнопка показывала бы наше
// представление о правиле, а не само правило. Показываем состояния, которые выражены
// атрибутами и потому настоящие: отключено, нажато, недопустимое значение, раскрыто, выбрано.
// Наведение и фокус проверяются мышью и клавишей Tab — так же, как у потребителя.

import {
  Button,
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
  Separator,
  Spinner,
  Textarea,
  Toggle,
} from "@omnifield/probe-web-ui";
import { createSignal, type JSX } from "solid-js";

export interface Specimen {
  id: string;
  title: string;
  /** Зацепки кита, которые этот образец показывает. Ими же сверяется полнота покрытия. */
  slots: string[];
  /** Основной вид — то, что показывается в режиме «главное». */
  main: () => JSX.Element;
  /** Состояния, выраженные атрибутами. Пусто — у примитива их нет. */
  states?: () => JSX.Element;
}

const FRUITS = ["Яблоко", "Груша", "Слива", "Абрикос"];

function SelectSpecimen(props: { disabled?: boolean }) {
  const [value, setValue] = createSignal<string | null>(FRUITS[0] ?? null);

  return (
    <Select
      value={value()}
      onChange={setValue}
      options={FRUITS}
      disabled={props.disabled}
      placeholder="Выберите…"
      itemComponent={(itemProps) => (
        <SelectItem item={itemProps.item}>
          <SelectItemLabel>{itemProps.item.rawValue}</SelectItemLabel>
          <SelectItemIndicator />
        </SelectItem>
      )}
    >
      <SelectTrigger aria-label="Плод">
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

export const SPECIMENS: Specimen[] = [
  {
    id: "button",
    title: "Кнопка",
    slots: ["button"],
    main: () => (
      <>
        <Button>Сохранить</Button>
        <Button>Ещё кнопка</Button>
      </>
    ),
    states: () => (
      <>
        <Button disabled>Отключена</Button>
        <Button>
          <Spinner aria-label="Идёт сохранение" />
          Сохраняем
        </Button>
      </>
    ),
  },
  {
    id: "field",
    title: "Поле",
    slots: ["field", "label", "input", "textarea", "field-description", "field-error"],
    main: () => (
      <>
        <Field>
          <Label>Имя набора</Label>
          <Input placeholder="например, продажи за квартал" />
          <FieldDescription>Короткое имя, по которому набор виден в списке.</FieldDescription>
        </Field>
        <Field>
          <Label>Заметка</Label>
          <Textarea placeholder="необязательно" />
        </Field>
      </>
    ),
    states: () => (
      <>
        <Field validationState="invalid">
          <Label>Адрес службы</Label>
          <Input value="ht!tp://" />
          <FieldError>Адрес не разобран — проверьте схему.</FieldError>
        </Field>
        <Field disabled>
          <Label>Ключ доступа</Label>
          <Input value="выдаётся администратором" />
        </Field>
        <Field readOnly>
          <Label>Владелец</Label>
          <Input value="owner-skin" />
        </Field>
      </>
    ),
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
    main: () => <SelectSpecimen />,
    states: () => <SelectSpecimen disabled />,
  },
  {
    id: "toggle",
    title: "Переключатель",
    slots: ["toggle"],
    main: () => (
      <>
        <Toggle>Не нажат</Toggle>
        <Toggle defaultPressed>Нажат</Toggle>
      </>
    ),
    states: () => (
      <>
        <Toggle disabled>Отключён</Toggle>
        <Toggle defaultPressed disabled>
          Нажат и отключён
        </Toggle>
      </>
    ),
  },
  {
    id: "separator",
    title: "Разделитель",
    slots: ["separator"],
    main: () => (
      <div class="specimen__stack">
        <span>Над чертой</span>
        <Separator />
        <span>Под чертой</span>
        <div class="specimen__inline">
          <span>Слева</span>
          <Separator orientation="vertical" />
          <span>Справа</span>
        </div>
      </div>
    ),
  },
  {
    id: "spinner",
    title: "Индикатор ожидания",
    slots: ["spinner"],
    main: () => (
      <>
        <Spinner aria-label="Загрузка" />
        <span class="specimen__inline">
          <Spinner aria-label="Загрузка" /> в строке текста
        </span>
      </>
    ),
  },
];

/** Все зацепки, которые стенд показывает хотя бы одним образцом. Сверяется пробой. */
export const SHOWN_SLOTS: readonly string[] = [...new Set(SPECIMENS.flatMap((s) => s.slots))];
