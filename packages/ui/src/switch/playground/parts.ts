import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SwitchPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const stateMeans = {
  checked: { means: "переключатель включён" },
  unchecked: { means: "переключатель выключен" },
  disabled: { means: "переключатель нельзя переключить" },
  readonly: { means: "значение видно, переключить нельзя" },
  invalid: { means: "окружающая форма отвергла значение" },
  required: { means: "форма потребует значение при отправке" },
  hover: { means: "указатель наведён на переключатель (следит машина, не браузер — корень это label, не наводимый нативно контрол)" },
  active: { means: "переключатель нажат и удерживается" },
  focus: { means: "фокус на скрытом инпуте — отражается сюда, поскольку видимые части сами фокус принять не могут" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
} satisfies PassportPartEditorInfo<SwitchPart>["states"];

export const parts: Readonly<Record<SwitchPart, PassportPartEditorInfo<SwitchPart>>> = {
  root: {
    means: "переключатель целиком — подпись, оборачивающая дорожку и собственный текст",
    states: stateMeans,
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "label" },
      { kind: "component" },
    ],
  },
  control: {
    means: "дорожка — видимая подложка, по которой скользит указатель",
    states: stateMeans,
    accepts: [{ kind: "component", name: "thumb" }],
  },
  thumb: {
    means: "подвижный указатель — скользит к одному концу дорожки или другому",
    states: stateMeans,
    accepts: [],
  },
  label: {
    means: "собственный текст переключателя",
    states: stateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
};
