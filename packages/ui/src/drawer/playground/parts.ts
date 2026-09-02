import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DrawerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "шторка открыта" },
  closed: { means: "шторка закрыта" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const swipeDirectionMeans = {
  up: { means: "шторка выезжает и закрывается вверх" },
  down: { means: "шторка выезжает и закрывается вниз" },
  left: { means: "шторка выезжает и закрывается влево" },
  right: { means: "шторка выезжает и закрывается вправо" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
  active: { means: "эта кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<DrawerPart>["states"];

export const parts: Readonly<Record<DrawerPart, PassportPartEditorInfo<DrawerPart>>> = {
  positioner: {
    means: "закрепляет содержимое шторки за тем краем, откуда она выезжает",
    states: { ...openClosedMeans, ...swipeDirectionMeans },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "собственная панель шторки",
    states: {
      ...openClosedMeans,
      ...swipeDirectionMeans,
      swiping: { means: "прямо сейчас идёт перетаскивание или открывающий свайп" },
      dragging: { means: "именно перетаскивание (не доводка после отпускания)" },
      expanded: { means: "шторка в полностью раскрытой точке привязки" },
      "nested-drawer-open": { means: "открыта шторка, вложенная поверх этой" },
      "nested-drawer-swiping": { means: "вложенную поверх этой шторку сейчас тащат" },
    },
    variables: {
      "--drawer-translate": { means: "текущее смещение выезда — то же значение, что и `--drawer-translate-y`" },
      "--drawer-translate-x": { means: "текущее горизонтальное смещение выезда/перетаскивания" },
      "--drawer-translate-y": { means: "текущее вертикальное смещение выезда/перетаскивания" },
      "--drawer-snap-point-offset-x": { means: "горизонтальное смещение активной точки привязки" },
      "--drawer-snap-point-offset-y": { means: "вертикальное смещение активной точки привязки" },
      "--drawer-swipe-movement-x": { means: "насколько далеко сдвинулся текущий свайп по горизонтали" },
      "--drawer-swipe-movement-y": { means: "насколько далеко сдвинулся текущий свайп по вертикали" },
      "--drawer-swipe-strength": { means: "насколько текущий свайп близок к порогу закрытия, доля от 0 до 1" },
      "--nested-drawers": { means: "сколько шторок вложено поверх этой" },
      "--drawer-height": { means: "измеренная высота содержимого этой шторки" },
      "--drawer-frontmost-height": { means: "измеренная высота самой верхней шторки в стопке" },
    },
    accepts: [
      { kind: "component", name: "grabber" },
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  title: {
    means: "заголовок шторки",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "описание шторки",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  trigger: {
    means: "открывает шторку",
    states: {
      ...openClosedMeans,
      current: { means: "в шторке с несколькими триггерами — тот, что её открыл" },
      ...buttonPseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "затемнённая подложка за шторкой — тускнеет вместе со свайпом",
    states: { ...openClosedMeans, swiping: { means: "прямо сейчас идёт перетаскивание или открывающий свайп" } },
    variables: {
      "--drawer-swipe-progress": { means: "насколько далеко текущий свайп уже раскрыл шторку, доля от 0 до 1" },
      "--drawer-swipe-strength": { means: "насколько текущий свайп близок к порогу закрытия, доля от 0 до 1" },
    },
    accepts: [],
  },
  grabber: {
    means: "ручка для перетаскивания — нажатие на неё запускает свайп-закрытие",
    states: { hover: { means: "указатель наведён на ручку" }, active: { means: "ручку держат нажатой" } },
    accepts: [{ kind: "component", name: "grabberIndicator" }],
  },
  grabberIndicator: {
    means: "видимая полоска внутри ручки — своей графики не несёт, полоску рисует скин",
    states: {},
    accepts: [],
  },
  closeTrigger: {
    means: "закрывает шторку",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  swipeArea: {
    means: "невидимая зона у края, позволяющая свайпом открыть закрытую шторку",
    states: {
      ...openClosedMeans,
      ...swipeDirectionMeans,
      swiping: { means: "прямо сейчас идёт перетаскивание или открывающий свайп" },
      disabled: { means: "открытие свайпом отключено" },
    },
    accepts: [],
  },
};
