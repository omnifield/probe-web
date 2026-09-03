import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type PopoverPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "поповер показан" },
  closed: { means: "поповер скрыт" },
} satisfies PassportPartEditorInfo<PopoverPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
  active: { means: "эта кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<PopoverPart>["states"];

export const parts: Readonly<Record<PopoverPart, PassportPartEditorInfo<PopoverPart>>> = {
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
  anchor: {
    means: "необязательная точка отсчёта — поповер позиционируется по ней вместо контрола",
    states: {},
    accepts: [{ kind: "component" }],
  },
  control: {
    means: "открывает и закрывает поповер",
    states: {
      ...openClosedMeans,
      current: { means: "это тот контрол, что открыл поповер (только в поповере с несколькими триггерами)" },
      ...buttonPseudoMeans,
    },
    accepts: [
      { kind: "component", name: "controlIndicator" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  controlIndicator: {
    means: "метка на контроле о том, открыт ли поповер — иконку кладёт потребитель",
    states: openClosedMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  positioner: {
    means: "позиционирует содержимое относительно контрола (или якоря) — чистая обёртка без своего вида",
    states: {},
    variables: {
      "--reference-width": { means: "измеренная ширина контрола (или якоря), относительно которого позиционируется поповер" },
      "--reference-height": { means: "измеренная высота контрола (или якоря), относительно которого позиционируется поповер" },
      "--available-width": { means: "место, оставшееся до края области просмотра" },
      "--available-height": { means: "место, оставшееся до края области просмотра" },
    },
    accepts: [
      { kind: "component", name: "arrow" },
      { kind: "component", name: "content" },
    ],
  },
  content: {
    means: "собственная плавающая панель поповера",
    states: openClosedMeans,
    accepts: [
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  title: {
    means: "заголовок поповера",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "описание поповера",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "закрывает поповер",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
