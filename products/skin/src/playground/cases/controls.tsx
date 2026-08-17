// Кейсы элементов управления: кнопка, кнопка-переключатель, флажок, переключатель, группа.
//
// ЧТО ЗДЕСЬ НЕ ПОДДЕЛЫВАЕТСЯ: наведение и фокус. Их нельзя вызвать из разметки, а нарисованная
// «как бы наведённая» кнопка показывала бы наше представление о правиле, а не правило. Всё,
// что показано, — настоящие состояния, выраженные атрибутами.

import {
  Button,
  Checkbox,
  CheckboxControl,
  CheckboxDescription,
  CheckboxError,
  CheckboxIndicator,
  CheckboxInput,
  CheckboxLabel,
  RadioGroup,
  RadioGroupDescription,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
  Spinner,
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
  Toggle,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import type { Specimen } from "./model.js";

function Box(props: { children: unknown }) {
  return <div class="case__row">{props.children as never}</div>;
}

export const CONTROL_SPECIMENS: Specimen[] = [
  {
    id: "button",
    title: "Кнопка",
    slots: ["button"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        render: () => (
          <Box>
            <Button>Сохранить</Button>
            <Button>Отмена</Button>
          </Box>
        ),
      },
      {
        id: "loading",
        title: "Идёт работа",
        note: "Индикатор внутри кнопки берёт цвет от неё — он на currentColor.",
        render: () => (
          <Box>
            <Button>
              <Spinner aria-label="Идёт сохранение" />
              Сохраняем
            </Button>
          </Box>
        ),
      },
      {
        id: "disabled",
        title: "Отключена",
        note: "Курсор меняется, фон уходит в нейтральный — состояние видно без цвета акцента.",
        render: () => (
          <Box>
            <Button disabled>Недоступно</Button>
          </Box>
        ),
      },
      {
        id: "long",
        title: "Длинная подпись",
        note: "Проверка, что кнопка растёт по содержимому и не рвёт строку внутри.",
        render: () => (
          <Box>
            <Button>Сохранить набор фильтров и закрыть панель</Button>
          </Box>
        ),
      },
      {
        id: "row",
        title: "Несколько подряд",
        note: "Интервал между кнопками задаёт потребитель — оформление не ставит внешних отступов.",
        render: () => (
          <Box>
            <Button>Применить</Button>
            <Button>Сбросить</Button>
            <Button disabled>Удалить</Button>
          </Box>
        ),
      },
    ],
  },
  {
    id: "toggle",
    title: "Кнопка-переключатель",
    slots: ["toggle"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Это про действие («полужирный»), а не про состояние системы — для второго есть переключатель.",
        render: () => (
          <Box>
            <Toggle>Не нажат</Toggle>
            <Toggle defaultPressed>Нажат</Toggle>
          </Box>
        ),
      },
      {
        id: "group",
        title: "Панель инструментов",
        note: "Несколько независимых кнопок подряд — типичное место для этого примитива.",
        render: () => (
          <Box>
            <Toggle defaultPressed>Ж</Toggle>
            <Toggle>К</Toggle>
            <Toggle>Ч</Toggle>
          </Box>
        ),
      },
      {
        id: "disabled",
        title: "Отключена",
        render: () => (
          <Box>
            <Toggle disabled>Отключён</Toggle>
            <Toggle defaultPressed disabled>
              Нажат и отключён
            </Toggle>
          </Box>
        ),
      },
    ],
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
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Квадрат со скруглением — форма отличает «сколько угодно» от круглого «одно».",
        render: () => (
          <Box>
            <Checkbox defaultChecked>
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>✓</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Показывать сетку</CheckboxLabel>
            </Checkbox>
          </Box>
        ),
      },
      {
        id: "description",
        title: "С пояснением",
        note: "Пояснение встаёт под подписью, а не под рамкой: текст выравнивается по началу подписи.",
        render: () => (
          <Box>
            <Checkbox>
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>✓</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Подписи осей</CheckboxLabel>
              <CheckboxDescription>Занимают место на узком экране.</CheckboxDescription>
            </Checkbox>
          </Box>
        ),
      },
      {
        id: "indeterminate",
        title: "Частично отмечен",
        note: "Красится как отмеченный, различает их фигура внутри — иначе состояние передавалось бы одним цветом.",
        render: () => (
          <Box>
            <Checkbox indeterminate>
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>–</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Выбраны не все колонки</CheckboxLabel>
            </Checkbox>
          </Box>
        ),
      },
      {
        id: "invalid",
        title: "Недопустимое значение",
        note: "Рамка меняет цвет И появляется текст ошибки: смысл не передаётся одним цветом (WCAG 1.4.1).",
        render: () => (
          <Box>
            <Checkbox validationState="invalid">
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>✓</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Согласие обязательно</CheckboxLabel>
              <CheckboxError>Без согласия не сохранить.</CheckboxError>
            </Checkbox>
          </Box>
        ),
      },
      {
        id: "list",
        title: "Список",
        note: "Проверка вертикального ритма: интервал между флажками задаёт потребитель.",
        render: () => (
          <div class="case__stack">
            <For each={["Имя", "Дата", "Сумма"]}>
              {(label, i) => (
                <Checkbox defaultChecked={i() === 0}>
                  <CheckboxInput />
                  <CheckboxControl>
                    <CheckboxIndicator>✓</CheckboxIndicator>
                  </CheckboxControl>
                  <CheckboxLabel>{label}</CheckboxLabel>
                </Checkbox>
              )}
            </For>
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        render: () => (
          <Box>
            <Checkbox disabled>
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>✓</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Недоступно</CheckboxLabel>
            </Checkbox>
            <Checkbox disabled defaultChecked>
              <CheckboxInput />
              <CheckboxControl>
                <CheckboxIndicator>✓</CheckboxIndicator>
              </CheckboxControl>
              <CheckboxLabel>Отмечено и недоступно</CheckboxLabel>
            </Checkbox>
          </Box>
        ),
      },
    ],
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
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Про состояние системы («тёмная тема включена»), а не про действие.",
        render: () => (
          <Box>
            <Switch defaultChecked>
              <SwitchInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <SwitchLabel>Тёмная тема</SwitchLabel>
            </Switch>
          </Box>
        ),
      },
      {
        id: "description",
        title: "С пояснением",
        render: () => (
          <Box>
            <Switch>
              <SwitchInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <SwitchLabel>Автообновление</SwitchLabel>
              <SwitchDescription>Раз в минуту, пока вкладка открыта.</SwitchDescription>
            </Switch>
          </Box>
        ),
      },
      {
        id: "list",
        title: "Список настроек",
        note: "Дорожки выстроены в столбец — проверка, что подписи не разъезжаются по высоте.",
        render: () => (
          <div class="case__stack">
            <For each={["Сетка", "Легенда", "Подписи"]}>
              {(label, i) => (
                <Switch defaultChecked={i() !== 1}>
                  <SwitchInput />
                  <SwitchControl>
                    <SwitchThumb />
                  </SwitchControl>
                  <SwitchLabel>{label}</SwitchLabel>
                </Switch>
              )}
            </For>
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Отключён",
        render: () => (
          <Box>
            <Switch disabled>
              <SwitchInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <SwitchLabel>Недоступно</SwitchLabel>
            </Switch>
            <Switch disabled defaultChecked>
              <SwitchInput />
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <SwitchLabel>Включено и недоступно</SwitchLabel>
            </Switch>
          </Box>
        ),
      },
    ],
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
    cases: [
      {
        id: "basic",
        title: "Базовая",
        render: () => (
          <RadioGroup defaultValue="M">
            <RadioGroupLabel>Плотность строк</RadioGroupLabel>
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
      },
      {
        id: "described",
        title: "С пояснениями у вариантов",
        note: "Пояснение варианта — своя зацепка, поэтому оно тише подписи и не спорит с ней.",
        render: () => (
          <RadioGroup defaultValue="auto">
            <RadioGroupLabel>Обновление данных</RadioGroupLabel>
            <RadioGroupDescription>Влияет на нагрузку на службу.</RadioGroupDescription>
            <For
              each={[
                { v: "auto", l: "Автоматически", d: "Раз в минуту" },
                { v: "manual", l: "По кнопке", d: "Только когда нажали" },
              ]}
            >
              {(item) => (
                <RadioGroupItem value={item.v}>
                  <RadioGroupItemInput />
                  <RadioGroupItemControl>
                    <RadioGroupItemIndicator />
                  </RadioGroupItemControl>
                  <RadioGroupItemLabel>{item.l}</RadioGroupItemLabel>
                  <RadioGroupItemDescription>{item.d}</RadioGroupItemDescription>
                </RadioGroupItem>
              )}
            </For>
          </RadioGroup>
        ),
      },
      {
        id: "disabled",
        title: "Отключённая группа",
        note: "Отключается корень — и приглушаются все варианты сразу, без правки каждого.",
        render: () => (
          <RadioGroup defaultValue="M" disabled>
            <RadioGroupLabel>Недоступно</RadioGroupLabel>
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
    ],
  },
];
