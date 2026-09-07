import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ToastPart, PassportPartEditorInfo<ToastPart>>> = {
  root: {
    means: "одно всплывающее сообщение",
    states: {
      open: { means: "сообщение показано" },
      closed: { means: "сообщение скрыто" },
    },
    variables: {
      "--x": { means: "измеренное горизонтальное смещение при появлении/уходе" },
      "--y": { means: "измеренное вертикальное смещение при появлении/уходе" },
      "--scale": { means: "измеренный масштаб при появлении/уходе" },
      "--opacity": { means: "измеренная прозрачность при появлении/уходе" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
