import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TabsPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<TabsPart, PassportPartEditorInfo<TabsPart>>> = {
  root: {
    means: "весь набор — ряд табов вместе с панелью, которая сейчас показана",
    states: { focus: { means: "какой-то таб в этом наборе в фокусе" } },
    accepts: [
      { kind: "component", name: "list" },
      { kind: "component", name: "content" },
    ],
  },
  list: {
    means: "ряд (или столбец) табов — оборачивает каждый триггер и скользящий указатель",
    states: { focus: { means: "какой-то таб в этом ряду в фокусе" } },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "component", name: "indicator" },
    ],
  },
  trigger: {
    means: "кнопка одного таба — переключает на его панель при активации",
    states: {
      selected: { means: "этот таб сейчас показан" },
      disabled: { means: "этот таб нельзя выбрать" },
      focus: { means: "фокус клавиатуры или указателя на этом табе" },
      hover: { means: "указатель наведён на этот таб" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "этот таб нажат и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  content: {
    means: "панель одного таба — содержимое, которое показано, пока его таб выбран",
    states: { selected: { means: "таб этой панели выбран — панель видна" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  indicator: {
    means: "скользящий указатель под (или рядом с) выбранным табом — просто бокс, своего графика не несёт",
    variables: {
      "--left": { means: "измеренное горизонтальное положение выбранного таба" },
      "--top": { means: "измеренное вертикальное положение выбранного таба" },
      "--width": { means: "измеренная ширина выбранного таба" },
      "--height": { means: "измеренная высота выбранного таба" },
    },
    accepts: [],
  },
};
