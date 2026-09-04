import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type SegmentGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const groupMeans = {
  disabled: { means: "набор отключён — выбрать нельзя" },
  invalid: { means: "набор невалиден по правилам валидации формы" },
  required: { means: "выбор обязателен для отправки формы" },
} satisfies PassportPartEditorInfo<SegmentGroupPart>["states"];

const itemMeans = {
  checked: { means: "этот пункт выбран" },
  unchecked: { means: "этот пункт не выбран" },
  disabled: { means: "этот пункт нельзя выбрать — свой отказ или отключён весь набор" },
  readonly: { means: "значение видно, выбрать другое нельзя" },
  invalid: { means: "набор невалиден по правилам валидации формы" },
  hover: { means: "указатель наведён на этот пункт" },
  focus: { means: "фокус стоит на скрытом вводе этого пункта" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — здесь нужна обводка" },
} satisfies PassportPartEditorInfo<SegmentGroupPart>["states"];

export const parts: Readonly<Record<SegmentGroupPart, PassportPartEditorInfo<SegmentGroupPart>>> = {
  root: {
    means: "переключатель целиком — оборачивает подпись, скользящую пилюлю и каждый сегмент",
    states: groupMeans,
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "item" },
      { kind: "component", name: "indicator" },
    ],
  },
  label: {
    means: "собственная подпись набора — описывает весь набор, не один сегмент",
    states: groupMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "один сегмент — кликабельная область целиком, клик в любом месте выбирает его",
    states: itemMeans,
    accepts: [
      { kind: "component", name: "itemControl" },
      { kind: "component", name: "itemText" },
    ],
  },
  itemText: {
    means: "видимая подпись сегмента",
    states: itemMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemControl: {
    means: "видимая поверхность сегмента — то, под что подстраивается размер скользящей пилюли",
    states: { ...itemMeans, active: { means: "этот сегмент нажат указателем" } },
    accepts: [],
  },
  indicator: {
    means: "единая скользящая пилюля выбранного сегмента — кит сам измеряет и позиционирует её, своего графика не несёт",
    states: { disabled: { means: "набор отключён" } },
    variables: {
      "--left": { means: "измеренное горизонтальное положение выбранного сегмента" },
      "--top": { means: "измеренное вертикальное положение выбранного сегмента" },
      "--width": { means: "измеренная ширина выбранного сегмента" },
      "--height": { means: "измеренная высота выбранного сегмента" },
    },
    accepts: [],
  },
};
