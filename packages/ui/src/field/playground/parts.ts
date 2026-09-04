import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type FieldPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const controlStateMeans = {
  invalid: { means: "окружающая форма отвергла значение" },
  required: { means: "форма потребует значение при отправке" },
  readonly: { means: "значение видно, изменить нельзя" },
  disabled: { means: "этим контролом нельзя пользоваться" },
  hover: { means: "указатель наведён на этот контрол" },
  focus: { means: "на этом контроле фокус — с клавиатуры или указателя" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом" },
} satisfies PassportPartEditorInfo<FieldPart>["states"];

export const parts: Readonly<Record<FieldPart, PassportPartEditorInfo<FieldPart>>> = {
  root: {
    means: "поле целиком — подпись, контрол, подсказка/ошибка и метка обязательности, увязанные в одну адресуемую доступную группу",
    states: {
      disabled: { means: "поле целиком отключено" },
      invalid: { means: "окружающая форма отвергла значение" },
      readonly: { means: "значение видно, изменить нельзя" },
    },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "input" },
      { kind: "component", name: "select" },
      { kind: "component", name: "textarea" },
      { kind: "component", name: "helperText" },
      { kind: "component", name: "errorText" },
      { kind: "component", name: "requiredIndicator" },
      { kind: "component" },
    ],
  },
  label: {
    means: "подпись поля",
    states: {
      disabled: { means: "поле целиком отключено" },
      invalid: { means: "окружающая форма отвергла значение" },
      readonly: { means: "значение видно, изменить нельзя" },
      required: { means: "форма потребует значение при отправке" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component", name: "requiredIndicator" },
    ],
  },
  input: {
    means: "обычный текстовый контрол, подключённый к полю — один из трёх взаимозаменяемых рендереров",
    states: controlStateMeans,
    accepts: [],
  },
  select: {
    means: "обычный нативный выпадающий контрол, подключённый к полю — один из трёх взаимозаменяемых рендереров",
    states: controlStateMeans,
  },
  textarea: {
    means: "обычный многострочный текстовый контрол, подключённый к полю — один из трёх взаимозаменяемых рендереров",
    states: controlStateMeans,
    accepts: [],
  },
  helperText: {
    means: "подсказка — смонтирована всегда, независимо от валидности",
    states: { disabled: { means: "поле целиком отключено" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  errorText: {
    means: "сообщение об ошибке валидации — смонтировано только пока поле невалидно",
    accepts: [{ kind: "content", genus: "text" }],
  },
  requiredIndicator: {
    means: "метка обязательности — смонтирована только пока поле обязательно; по умолчанию «*»",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
