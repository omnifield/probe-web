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
  Checkbox,
  CheckboxControl,
  CheckboxDescription,
  CheckboxError,
  CheckboxIndicator,
  CheckboxInput,
  CheckboxLabel,
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
  RadioGroup,
  RadioGroupDescription,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
  Separator,
  Spinner,
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
  Textarea,
  Toggle,
} from "@omnifield/probe-web-ui";
import { createSignal, For, type JSX } from "solid-js";

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
    id: "checkbox",
    title: "Флажок",
    slots: [
      "checkbox",
      "checkbox-input",
      "checkbox-control",
      "checkbox-indicator",
      "checkbox-label",
      "checkbox-description",
      "checkbox-error",
    ],
    main: () => (
      <>
        <Checkbox defaultChecked>
          <CheckboxInput />
          <CheckboxControl>
            <CheckboxIndicator>✓</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Показывать сетку</CheckboxLabel>
        </Checkbox>
        <Checkbox>
          <CheckboxInput />
          <CheckboxControl>
            <CheckboxIndicator>✓</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Подписи осей</CheckboxLabel>
          <CheckboxDescription>Занимают место на узком экране.</CheckboxDescription>
        </Checkbox>
      </>
    ),
    states: () => (
      <>
        <Checkbox indeterminate>
          <CheckboxInput />
          <CheckboxControl>
            <CheckboxIndicator>–</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Выбраны не все</CheckboxLabel>
        </Checkbox>
        <Checkbox disabled defaultChecked>
          <CheckboxInput />
          <CheckboxControl>
            <CheckboxIndicator>✓</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Отключён и отмечен</CheckboxLabel>
        </Checkbox>
        <Checkbox validationState="invalid">
          <CheckboxInput />
          <CheckboxControl>
            <CheckboxIndicator>✓</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Согласие обязательно</CheckboxLabel>
          <CheckboxError>Без согласия не сохранить.</CheckboxError>
        </Checkbox>
      </>
    ),
  },
  {
    id: "switch",
    title: "Переключатель",
    slots: [
      "switch",
      "switch-input",
      "switch-control",
      "switch-thumb",
      "switch-label",
      "switch-description",
      "switch-error",
    ],
    main: () => (
      <>
        <Switch defaultChecked>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Тёмная тема</SwitchLabel>
        </Switch>
        <Switch>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Автообновление</SwitchLabel>
          <SwitchDescription>Раз в минуту, пока вкладка открыта.</SwitchDescription>
        </Switch>
      </>
    ),
    states: () => (
      <>
        <Switch disabled>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Отключён</SwitchLabel>
        </Switch>
        <Switch disabled defaultChecked>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Отключён и включён</SwitchLabel>
        </Switch>
      </>
    ),
  },
  {
    id: "radio-group",
    title: "Группа выбора",
    slots: [
      "radio-group",
      "radio-group-label",
      "radio-group-description",
      "radio-group-error",
      "radio-group-item",
      "radio-group-item-input",
      "radio-group-item-control",
      "radio-group-item-indicator",
      "radio-group-item-label",
      "radio-group-item-description",
    ],
    main: () => (
      <RadioGroup defaultValue="M">
        <RadioGroupLabel>Плотность строк</RadioGroupLabel>
        <RadioGroupDescription>Влияет на высоту строки таблицы.</RadioGroupDescription>
        <For each={["S", "M", "L"]}>
          {(value) => (
            <RadioGroupItem value={value}>
              <RadioGroupItemInput />
              <RadioGroupItemControl>
                <RadioGroupItemIndicator />
              </RadioGroupItemControl>
              <RadioGroupItemLabel>{value}</RadioGroupItemLabel>
            </RadioGroupItem>
          )}
        </For>
      </RadioGroup>
    ),
    states: () => (
      <RadioGroup defaultValue="M" disabled>
        <RadioGroupLabel>Отключённая группа</RadioGroupLabel>
        <For each={["S", "M"]}>
          {(value) => (
            <RadioGroupItem value={value}>
              <RadioGroupItemInput />
              <RadioGroupItemControl>
                <RadioGroupItemIndicator />
              </RadioGroupItemControl>
              <RadioGroupItemLabel>{value}</RadioGroupItemLabel>
            </RadioGroupItem>
          )}
        </For>
      </RadioGroup>
    ),
  },
  {
    id: "toggle",
    title: "Кнопка-переключатель",
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
