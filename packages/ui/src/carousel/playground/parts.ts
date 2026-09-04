import type { PassportPartEditorInfo, PassportStateEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type CarouselPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const pseudoMeans: Readonly<Record<"hover" | "focus-visible" | "active", PassportStateEditorInfo>> = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
  active: { means: "эта кнопка нажата и удерживается" },
};

export const parts: Readonly<Record<CarouselPart, PassportPartEditorInfo<CarouselPart>>> = {
  root: {
    means: "карусель целиком — область показа, навигация и индикаторы вместе",
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "indicatorGroup" },
      { kind: "component", name: "progressText" },
    ],
  },
  itemGroup: {
    means: "прокручиваемая область показа, держит все слайды",
    states: { dragging: { means: "область тащат указателем (только когда включён allowMouseDrag)" } },
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "один слайд",
    states: { inview: { means: "этот слайд сейчас виден в области показа (превышен inViewThreshold)" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  control: {
    means: "оборачивает кнопки вперёд/назад и, если есть, переключатель автопрокрутки",
    accepts: [
      { kind: "component", name: "prevTrigger" },
      { kind: "component", name: "nextTrigger" },
      { kind: "component", name: "autoplayTrigger" },
    ],
  },
  prevTrigger: {
    means: "прокручивает на страницу назад",
    states: {
      disabled: { means: "уже на первой странице, и карусель не зациклена — назад прокручивать некуда" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  nextTrigger: {
    means: "прокручивает на страницу вперёд",
    states: {
      disabled: { means: "уже на последней странице, и карусель не зациклена — вперёд прокручивать некуда" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicatorGroup: {
    means: "оборачивает по одному индикатору на слайд (или на страницу, если slidesPerPage больше одного)",
    accepts: [{ kind: "component", name: "indicator" }],
  },
  indicator: {
    means: "одна точка — по клику переходит сразу на свой слайд",
    states: {
      current: { means: "слайд этой точки — тот, что сейчас показан" },
      readonly: { means: "клик ничего не делает — индикатор сделан только для чтения" },
      ...pseudoMeans,
    },
    accepts: [],
  },
  autoplayTrigger: {
    means: "запускает или ставит на паузу автопрокрутку",
    states: {
      pressed: { means: "автопрокрутка идёт — переключатель во включённом состоянии" },
      ...pseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component", name: "autoplayIndicator" },
    ],
  },
  progressText: {
    means: "текст со счётчиком страниц",
    accepts: [{ kind: "content", genus: "text" }],
  },
  autoplayIndicator: {
    means: "своя иконка кнопки автопрокрутки — меняется между children (идёт) и fallback (пауза); узел смонтирован всегда, меняется только содержимое",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
