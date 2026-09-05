import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ScrollAreaPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const overflowMeans = {
  "overflow-x": { means: "содержимое переполняет по горизонтали — может существовать горизонтальный ползунок" },
  "overflow-y": { means: "содержимое переполняет по вертикали — может существовать вертикальный ползунок" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

const orientationMeans = {
  vertical: { means: "этот узел — вертикальный экземпляр; область прокрутки рисует по одному такому на каждую ось" },
  horizontal: { means: "этот узел — горизонтальный экземпляр; область прокрутки рисует по одному такому на каждую ось" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

const hoverDraggingMeans = {
  hover: { means: "указатель где-то рядом с собственными элементами управления прокруткой прямо сейчас" },
  dragging: { means: "ползунок сейчас тащат" },
} satisfies PassportPartEditorInfo<ScrollAreaPart>["states"];

export const parts: Readonly<Record<ScrollAreaPart, PassportPartEditorInfo<ScrollAreaPart>>> = {
  root: {
    means: "область прокрутки целиком — задаёт видимое окно и измеряет четыре переменные, которые читают её собственные ползунок/бегунок/угол",
    states: overflowMeans,
    variables: {
      "--corner-width": { means: "измеренная ширина квадрата угла" },
      "--corner-height": { means: "измеренная высота квадрата угла" },
      "--thumb-width": { means: "измеренная ширина вертикального бегунка" },
      "--thumb-height": { means: "измеренная высота горизонтального бегунка" },
    },
    accepts: [
      { kind: "component", name: "viewport" },
      { kind: "component", name: "scrollbar" },
      { kind: "component", name: "corner" },
    ],
  },
  viewport: {
    means: "окно обрезки — нативный overflow:auto, настоящие события прокрутки",
    states: {
      ...overflowMeans,
      "at-top": { means: "прокручено до самого верха" },
      "at-bottom": { means: "прокручено до самого низа" },
      "at-left": { means: "прокручено до самого левого края" },
      "at-right": { means: "прокручено до самого правого края" },
    },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "само прокручиваемое содержимое — подстраивается под то, что в него положил потребитель",
    states: overflowMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  scrollbar: {
    means: "собственный трек одной оси",
    states: {
      ...orientationMeans,
      ...overflowMeans,
      ...hoverDraggingMeans,
      scrolling: { means: "прокрутка по этой оси происходит прямо сейчас" },
    },
    accepts: [{ kind: "component", name: "thumb" }],
  },
  thumb: {
    means: "собственный бегунок одной оси",
    states: { ...orientationMeans, ...hoverDraggingMeans },
    accepts: [],
  },
  corner: {
    means: "квадрат, где иначе пересеклись бы два ползунка",
    states: {
      ...overflowMeans,
      hover: hoverDraggingMeans.hover,
      hidden: { means: "скрыт скином — прокрутка только по одной оси, заполнять нечего" },
      visible: { means: "показан скином — прокрутка по обеим осям, квадрат угла нужен" },
    },
    accepts: [],
  },
};
