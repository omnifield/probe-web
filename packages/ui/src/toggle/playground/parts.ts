import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TogglePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sharedMeans = {
  on: { means: "тумблер нажат" },
  off: { means: "тумблер не нажат" },
  pressed: { means: "тумблер нажат — тот же факт, что и `on`, но кодируется наличием атрибута, а не двумя значениями" },
  disabled: { means: "тумблер отключён — нажать нельзя" },
} satisfies PassportPartEditorInfo<TogglePart>["states"];

export const parts: Readonly<Record<TogglePart, PassportPartEditorInfo<TogglePart>>> = {
  root: {
    means: "тумблер целиком — один `<button aria-pressed>`, оборачивает `indicator`",
    states: {
      ...sharedMeans,
      hover: { means: "указатель наведён на кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "кнопка нажата и удерживается" },
    },
    accepts: [{ kind: "component", name: "indicator" }],
  },
  indicator: {
    means: "глиф внутри кнопки — иконку или галочку кладёт потребитель",
    states: sharedMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
