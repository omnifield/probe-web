import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type RadioGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const groupMeans = {
  disabled: { means: "набор отключён — выбрать нельзя" },
  invalid: { means: "набор невалиден по правилам валидации формы" },
  required: { means: "выбор обязателен для отправки формы" },
} satisfies PassportPartEditorInfo<RadioGroupPart>["states"];

const itemMeans = {
  checked: { means: "этот пункт выбран" },
  unchecked: { means: "этот пункт не выбран" },
  disabled: { means: "этот пункт нельзя выбрать — свой отказ или отключён весь набор" },
  readonly: { means: "значение видно, выбрать другое нельзя" },
  invalid: { means: "набор невалиден по правилам валидации формы" },
  hover: { means: "указатель наведён на этот пункт" },
  focus: { means: "фокус стоит на скрытом вводе этого пункта" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — здесь нужна обводка" },
} satisfies PassportPartEditorInfo<RadioGroupPart>["states"];

export const parts: Readonly<Record<RadioGroupPart, PassportPartEditorInfo<RadioGroupPart>>> = {
  root: {
    means: "набор радио-кнопок целиком — оборачивает подпись, скользящий указатель и каждый пункт",
    states: groupMeans,
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "indicator" },
      { kind: "component", name: "item" },
    ],
  },
  label: {
    means: "собственная подпись набора",
    states: groupMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "один пункт выбора — узел `<label>`, клик по нему выбирает его",
    states: itemMeans,
    accepts: [
      { kind: "component", name: "itemControl" },
      { kind: "component", name: "itemText" },
    ],
  },
  itemText: {
    means: "видимая подпись пункта",
    states: itemMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemControl: {
    means: "видимый кружок пункта — заполняется, когда пункт выбран",
    states: { ...itemMeans, active: { means: "этот пункт нажат указателем" } },
    accepts: [{ kind: "content", genus: "icon" }, { kind: "component" }],
  },
  indicator: {
    means: "единый скользящий указатель выбранного пункта — кит сам измеряет и позиционирует его, своего графика не несёт",
    states: { disabled: { means: "набор отключён" } },
    variables: {
      "--left": { means: "измеренное горизонтальное положение выбранного пункта" },
      "--top": { means: "измеренное вертикальное положение выбранного пункта" },
      "--width": { means: "измеренная ширина выбранного пункта" },
      "--height": { means: "измеренная высота выбранного пункта" },
    },
    accepts: [],
  },
};
