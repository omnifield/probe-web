import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SliderPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const groupMeans = {
  disabled: { means: "слайдер отключён — тянуть нельзя" },
  invalid: { means: "слайдер невалиден по правилам валидации формы" },
  dragging: { means: "идёт перетаскивание — какой-то бегунок тянут прямо сейчас" },
  focus: { means: "какой-то бегунок в фокусе" },
} satisfies PassportPartEditorInfo<SliderPart>["states"];

export const parts: Readonly<Record<SliderPart, PassportPartEditorInfo<SliderPart>>> = {
  root: {
    means: "слайдер целиком — держит значение(я), min/max/step и ориентацию",
    states: groupMeans,
    variables: {
      "--slider-thumb-width": { means: "измеренная ширина бегунка" },
      "--slider-thumb-height": { means: "измеренная высота бегунка" },
      "--slider-thumb-transform": { means: "центрирующий transform бегунка — зависит от оси и направления письма" },
      "--slider-range-start": { means: "начало закрашенной части дорожки" },
      "--slider-range-end": { means: "конец закрашенной части дорожки" },
    },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "valueText" },
      { kind: "component", name: "control" },
    ],
  },
  label: {
    means: "собственная подпись слайдера — клик по ней фокусирует первый бегунок",
    states: groupMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  valueText: {
    means: "текущее значение текстом — сам текст кладёт потребитель",
    states: { disabled: { means: "слайдер отключён" }, invalid: { means: "слайдер невалиден" }, focus: { means: "какой-то бегунок в фокусе" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "область для перетаскивания — клик в любом месте двигает ближайший бегунок туда",
    states: groupMeans,
    accepts: [
      { kind: "component", name: "track" },
      { kind: "component", name: "thumb" },
      { kind: "component", name: "markerGroup" },
      { kind: "component", name: "draggingIndicator" },
    ],
  },
  track: {
    means: "дорожка на всю длину — оборачивает закрашенную часть",
    states: groupMeans,
    accepts: [{ kind: "component", name: "range" }],
  },
  range: {
    means: "закрашенная часть дорожки — от точки отсчёта до значения(й)",
    states: groupMeans,
    accepts: [],
  },
  thumb: {
    means: "один перетаскиваемый бегунок — настоящий фокусируемый узел (`role=\"slider\"`)",
    states: {
      disabled: { means: "этот бегунок отключён" },
      focus: { means: "фокус на этом бегунке" },
      dragging: { means: "этот бегунок тянут прямо сейчас" },
      hover: { means: "указатель наведён на этот бегунок" },
      active: { means: "этот бегунок нажат и удерживается" },
    },
    accepts: [],
  },
  markerGroup: {
    means: "оборачивает все деления шкалы — декоративная, вне доступности",
    states: {},
    accepts: [{ kind: "component", name: "marker" }],
  },
  marker: {
    means: "одно деление шкалы вдоль дорожки — своего графика не несёт",
    states: {
      disabled: { means: "слайдер отключён" },
      "under-value": { means: "деление лежит ниже текущего значения" },
      "at-value": { means: "деление совпадает с текущим значением" },
      "over-value": { means: "деление лежит выше текущего значения" },
    },
    variables: {
      "--translate-x": { means: "горизонтальное центрирование деления — зависит от оси и направления письма" },
      "--translate-y": { means: "вертикальное центрирование деления — зависит от оси" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  draggingIndicator: {
    means: "подсказка-указатель, следующая за перетаскиваемым бегунком",
    states: {
      open: { means: "бегунок, за которым он следит, сейчас тянут" },
      closed: { means: "ничего не тянут" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
