import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type CheckboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sharedStates = {
  checked: { means: "чекбокс отмечен" },
  unchecked: { means: "чекбокс не отмечен" },
  indeterminate: { means: "отмечен отчасти — обычно чекбокс, суммирующий частично отмеченных потомков" },
  disabled: { means: "чекбокс отключён — его нельзя переключить" },
  readonly: { means: "чекбокс только для чтения — отметку видно, переключить нельзя" },
  invalid: { means: "чекбокс невалиден по правилам валидации формы" },
  required: { means: "чекбокс обязателен для отправки формы" },
  hover: { means: "указатель наведён на чекбокс" },
  active: { means: "чекбокс нажат указателем" },
  focus: { means: "фокус стоит на чекбоксе" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — здесь нужна обводка" },
} as const;

export const parts: Readonly<Record<CheckboxPart, PassportPartEditorInfo<CheckboxPart>>> = {
  root: {
    means: "чекбокс целиком — узел `<label>`, клик по нему переключает отметку",
    states: sharedStates,
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "indicator" },
      { kind: "component", name: "label" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  control: {
    means: "управляющая рамка — видимый квадрат, держит указатель отметки",
    states: sharedStates,
    accepts: [
      { kind: "component", name: "indicator" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  indicator: {
    means: "указатель отметки — галочка или черта, кладёт потребитель",
    states: sharedStates,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  label: {
    means: "подпись чекбокса",
    states: sharedStates,
    accepts: [{ kind: "content", genus: "text" }],
  },
};
