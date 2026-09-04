import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ToggleGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ToggleGroupPart, PassportPartEditorInfo<ToggleGroupPart>>> = {
  root: {
    means: "весь ряд (или столбец) кнопок",
    states: {
      disabled: { means: "весь набор отключён — ни одну кнопку нельзя нажать" },
      focus: { means: "какая-то кнопка в наборе в фокусе" },
    },
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "одна кнопка — нажатие переключает её вкл/выкл",
    states: {
      on: { means: "эта кнопка нажата" },
      off: { means: "эта кнопка не нажата" },
      disabled: { means: "эту кнопку нельзя нажать — свой флаг или отключён весь набор" },
      focus: { means: "машина считает эту кнопку текущей в роуминг-фокусе" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      hover: { means: "указатель наведён на кнопку" },
      active: { means: "кнопка нажата и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
