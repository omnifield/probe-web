import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "диалог открыт" },
  closed: { means: "диалог закрыт" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
  active: { means: "эта кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

export const parts: Readonly<Record<DialogPart, PassportPartEditorInfo<DialogPart>>> = {
  trigger: {
    means: "открывает диалог",
    states: {
      ...openClosedMeans,
      current: { means: "в диалоге с несколькими триггерами — тот, что его открыл" },
      ...buttonPseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "затемнённая подложка за диалогом",
    states: openClosedMeans,
    accepts: [],
  },
  positioner: {
    means: "центрирует содержимое диалога во вьюпорте — чистая обёртка, своего вида не несёт",
    states: {},
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "собственная панель диалога",
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
    means: "заголовок диалога",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "описание диалога",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "закрывает диалог",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
