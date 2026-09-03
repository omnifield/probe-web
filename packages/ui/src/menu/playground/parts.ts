import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "меню показано" },
  closed: { means: "меню скрыто" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
  active: { means: "кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

const optionMeans = {
  checked: { means: "этот чекбоксный/радио-пункт отмечен" },
  unchecked: { means: "этот чекбоксный/радио-пункт не отмечен" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

const itemFamilyMeans = {
  disabled: { means: "этот пункт нельзя выбрать" },
  highlighted: { means: "текущая цель клавиатуры/указателя — виртуальный факт, не настоящий DOM-фокус" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

export const parts: Readonly<Record<MenuPart, PassportPartEditorInfo<MenuPart>>> = {
  arrow: {
    means: "оборачивает `arrowTip` — кит сам ставит позицию, своего вида не несёт",
    states: {},
    accepts: [{ kind: "component", name: "arrowTip" }],
  },
  arrowTip: {
    means: "видимый треугольник внутри `arrow` — форму (обычно повёрнутый квадрат) рисует скин",
    states: {},
    accepts: [],
  },
  positioner: {
    means: "позиционирует `content` относительно того триггера, который его открыл — чистая обёртка без своего вида",
    states: {},
    variables: {
      "--reference-width": { means: "измеренная ширина триггера, относительно которого позиционируется меню" },
      "--reference-height": { means: "измеренная высота триггера, относительно которого позиционируется меню" },
      "--available-width": { means: "место, оставшееся до края области просмотра" },
      "--available-height": { means: "место, оставшееся до края области просмотра" },
    },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "плавающая панель — держит настоящий фокус клавиатуры разом за все пункты",
    states: openClosedMeans,
    accepts: [
      { kind: "component", name: "arrow" },
      { kind: "component", name: "item" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "separator" },
    ],
  },
  indicator: {
    means: "небольшая метка на `trigger` о том, открыто ли меню — своего вида не несёт",
    states: openClosedMeans,
    accepts: [],
  },
  trigger: {
    means: "открывает меню",
    states: { ...openClosedMeans, current: { means: "это тот триггер, что открыл меню (только в меню с несколькими триггерами)" }, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  triggerItem: {
    means: "собственный триггер подменю, отрисованный как пункт родительского меню",
    states: { ...openClosedMeans, disabled: { means: "этот пункт (и подменю, которое он открывает) нельзя выбрать" }, highlighted: { means: "текущая цель клавиатуры/указателя" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  contextTrigger: {
    means: "оборачивает элемент так, что правый клик (или долгое нажатие) открывает меню у указателя",
    states: { ...openClosedMeans, current: { means: "это тот триггер, что открыл меню (только в меню с несколькими триггерами)" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  separator: {
    means: "визуальный/смысловой разделитель между группами пунктов",
    states: {},
    accepts: [],
  },
  itemGroup: {
    means: "оборачивает подписанную группу пунктов",
    states: {},
    accepts: [
      { kind: "component", name: "itemGroupLabel" },
      { kind: "component", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "собственный заголовок группы",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "одно действие — обычное, либо в форме чекбокса/радио (какое — говорит data-type)",
    states: {
      ...itemFamilyMeans,
      ...optionMeans,
      radio: { means: "это радио-пункт — один из взаимоисключающего набора" },
      checkbox: { means: "это чекбоксный пункт — переключается независимо" },
    },
    accepts: [
      { kind: "component", name: "itemIndicator" },
      { kind: "component", name: "itemText" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemIndicator: {
    means: "слот галочки/точки внутри чекбоксного/радио-пункта — кит прячет его, пока не отмечен",
    states: { ...itemFamilyMeans, ...optionMeans },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  itemText: {
    means: "собственная подпись пункта",
    states: { ...itemFamilyMeans, ...optionMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
