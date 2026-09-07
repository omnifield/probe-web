import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<DialogPart, PassportPartEditorInfo<DialogPart>>> = {
  control: {
    means: "открывает диалог",
    states: {
      open: { means: "диалог открыт" },
      closed: { means: "диалог закрыт" },
      current: { means: "в диалоге с несколькими control — тот, что его открыл" },
      hover: { means: "указатель наведён на эту кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
      active: { means: "эта кнопка нажата и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "затемнённая подложка за диалогом — кладётся сама, отдельно не составляется",
    states: {
      open: { means: "диалог открыт" },
      closed: { means: "диалог закрыт" },
    },
  },
  content: {
    means: "механика диалога — портал, открытие/закрытие, фокус-ловушка; что внутри и как оно выглядит, решает и стилизует само содержимое, не кит",
    states: {
      open: { means: "диалог открыт" },
      closed: { means: "диалог закрыт" },
    },
  },
  closeTrigger: {
    means: "закрывает диалог — кладётся сама рядом с содержимым, отдельно не составляется",
    states: {
      hover: { means: "указатель наведён на эту кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
      active: { means: "эта кнопка нажата и удерживается" },
    },
  },
};
