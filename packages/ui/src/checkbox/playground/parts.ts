// EDITOR-ONLY per-part taxonomy for the checkbox — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-115`/`PWEB-118`, split out `PWEB-127`). Means, states, and nesting — the taxonomy
// half of the editor slice; scenario data (`assemblies.ts`) is the other, split out the same way:
// the same physical shape as every other component's `playground/`.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself — see `assemblies.ts` for the same
// device and the same reason (no contextual typing reaches into a separate module).
type CheckboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<CheckboxPart, PassportPartEditorInfo<CheckboxPart>>> = {
  root: {
    means: "чекбокс целиком — узел `<label>`, клик по нему переключает отметку",
    states: {
      checked: { means: "чекбокс отмечен" },
      unchecked: { means: "чекбокс не отмечен" },
      indeterminate: { means: "отмечен отчасти — обычно у чекбокса с частично отмеченными вложенными" },
      disabled: { means: "чекбокс отключён — переключить нельзя" },
      readonly: { means: "чекбокс только для чтения — состояние видно, переключить нельзя" },
      invalid: { means: "чекбокс невалиден по правилам формы" },
      required: { means: "чекбокс обязателен для отправки формы" },
      hover: { means: "указатель наведён на чекбокс" },
      active: { means: "чекбокс нажат указателем" },
      focus: { means: "фокус стоит на чекбоксе" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — кольцу фокуса тут самое место" },
    },
    // Подпись и управляющая часть кладутся внутрь потребителем; своих частей корень
    // принимает три — control, indicator (вложен в control реальной разметкой Ark, но
    // паспорт называет вложенность как ДОСТУПНУЮ, а не как единственно верную структуру,
    // тем же приёмом, что у гармошки) и label.
    accepts: [
      { kind: "part", name: "control" },
      { kind: "part", name: "indicator" },
      { kind: "part", name: "label" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
      // Настоящий скрытый `<input type="checkbox">` (`PWEB-152`) — узел, на котором реально
      // висит `onChange`; без него превью выглядит верно, но клик ничего не переключает.
      { kind: "extra", name: "hiddenInput" },
    ],
  },
  control: {
    means: "управляющая рамка — видимый квадрат, в который кладут указатель отметки",
    states: {
      checked: { means: "чекбокс отмечен" },
      unchecked: { means: "чекбокс не отмечен" },
      indeterminate: { means: "отмечен отчасти — обычно у чекбокса с частично отмеченными вложенными" },
      disabled: { means: "чекбокс отключён — переключить нельзя" },
      readonly: { means: "чекбокс только для чтения — состояние видно, переключить нельзя" },
      invalid: { means: "чекбокс невалиден по правилам формы" },
      required: { means: "чекбокс обязателен для отправки формы" },
      hover: { means: "указатель наведён на чекбокс" },
      active: { means: "чекбокс нажат указателем" },
      focus: { means: "фокус стоит на чекбоксе" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — кольцу фокуса тут самое место" },
    },
    accepts: [
      { kind: "part", name: "indicator" },
      { kind: "content", genus: "icon" },
      { kind: "content", genus: "component" },
    ],
  },
  indicator: {
    means: "указатель отметки — галочка или черта, которую кладёт потребитель",
    states: {
      checked: { means: "чекбокс отмечен" },
      unchecked: { means: "чекбокс не отмечен" },
      indeterminate: { means: "отмечен отчасти — обычно у чекбокса с частично отмеченными вложенными" },
      disabled: { means: "чекбокс отключён — переключить нельзя" },
      readonly: { means: "чекбокс только для чтения — состояние видно, переключить нельзя" },
      invalid: { means: "чекбокс невалиден по правилам формы" },
      required: { means: "чекбокс обязателен для отправки формы" },
      hover: { means: "указатель наведён на чекбокс" },
      active: { means: "чекбокс нажат указателем" },
      focus: { means: "фокус стоит на чекбоксе" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — кольцу фокуса тут самое место" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  label: {
    means: "подпись чекбокса",
    states: {
      checked: { means: "чекбокс отмечен" },
      unchecked: { means: "чекбокс не отмечен" },
      indeterminate: { means: "отмечен отчасти — обычно у чекбокса с частично отмеченными вложенными" },
      disabled: { means: "чекбокс отключён — переключить нельзя" },
      readonly: { means: "чекбокс только для чтения — состояние видно, переключить нельзя" },
      invalid: { means: "чекбокс невалиден по правилам формы" },
      required: { means: "чекбокс обязателен для отправки формы" },
      hover: { means: "указатель наведён на чекбокс" },
      active: { means: "чекбокс нажат указателем" },
      focus: { means: "фокус стоит на чекбоксе" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — кольцу фокуса тут самое место" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
