import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ButtonPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<ButtonPart, PassportPartEditorInfo<ButtonPart>>> = {
  root: {
    means: "кнопка целиком — один узел, по умолчанию настоящий `<button type=\"button\">`",
    states: {
      hover: { means: "указатель наведён на кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
      active: { means: "кнопка нажата и удерживается" },
      disabled: { means: "нельзя нажать — обработчик не вызывается" },
      busy: { means: "идёт работа — атрибут ставит потребитель вместе с `disabled`" },
      expanded: { means: "кнопка раскрыла то, чем управляет — атрибут приходит от внешнего компонента" },
      pressed: { means: "кнопка-переключатель нажата — сама нажатость принадлежит внешнему компоненту, вид — кнопке" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
