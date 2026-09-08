import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ToastPart, PassportPartEditorInfo<ToastPart>>> = {
  group: {
    means: "точка монтирования — стек всех текущих уведомлений; кладётся один раз, содержимое создаёт control.ts",
  },
  root: {
    means: "одно всплывающее сообщение — кладётся само внутри group, отдельно не составляется",
    states: {
      open: { means: "сообщение показано" },
      closed: { means: "сообщение скрыто" },
    },
    variables: {
      "--x": { means: "измеренное горизонтальное смещение при появлении/уходе" },
      "--y": { means: "измеренное вертикальное смещение при появлении/уходе" },
      "--scale": { means: "измеренный масштаб при появлении/уходе" },
      "--z-index": { means: "измеренный порядок наложения при стопке нескольких сообщений" },
      "--height": { means: "измеренная высота — нужна для расчёта отступа следующего сообщения" },
      "--opacity": { means: "измеренная прозрачность при появлении/уходе" },
      "--gap": { means: "измеренный зазор между соседними сообщениями" },
    },
  },
  title: {
    means: "заголовок сообщения — кладётся сам внутри root, отдельно не составляется",
  },
  description: {
    means: "текст сообщения — кладётся сам внутри root, отдельно не составляется",
  },
  closeTrigger: {
    means: "закрывает сообщение — кладётся сама внутри root, отдельно не составляется",
    states: {
      hover: { means: "указатель наведён на эту кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
      active: { means: "эта кнопка нажата и удерживается" },
    },
  },
};
