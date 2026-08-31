// РАНТАЙМ-паспорт чекбокса (`PWEB-114`, разнесено `PWEB-127`) — анатомия (`anatomy.ts`) плюс всё,
// чего анатомия не говорит: состояния по частям и ось вариаций, увязанные `definePassport`.
//
// ЭТОТ ФАЙЛ ТОЛЬКО РАНТАЙМ, как и анатомия, на которой он стоит, — уезжает в бандл приложения.
// Срез РЕДАКТОРА (`means`, род, группа, вложенность, сборка) — в `playground/index.ts`; тот файл
// зависит от этого, а не наоборот.
//
// ## Скрытый ввод — без адреса, и это не пробел
//
// `getHiddenInputProps()` (`@zag-js/checkbox`, `checkbox.connect.mjs`) не спредит `parts.*.attrs`
// вовсе — настоящий `<input type="checkbox">` остаётся в документе ради фокуса, формы и
// скринридера, но паспортного адреса не несёт. Мы его не выдумываем: часть, которую поставщик не
// адресовал, не адресуема ничем, а спрятанный ввод сегодня функция доступности, а не тема скина.
//
// ## Состояния — данные, а не псевдоклассы, и это находка, а не выбор
//
// У кнопки наведение и фокус выражены псевдоклассами: их знает браузер, а не компонент. Здесь
// иначе. Реальный фокус лежит на СКРЫТОМ `<input>`, а не на видимых узлах (`root`/`control`/
// `indicator`/`label`), и браузерные `:hover`/`:focus`/`:active` на них просто не сработают —
// поэтому Zag следит за указателем и фокусом САМ (`onPointerMove`/`onPointerLeave` на root,
// `onFocus`/`onBlur` на скрытом вводе) и кладёт результат данными: `data-hover`, `data-focus`,
// `data-focus-visible`, `data-active`. Ни одного псевдокласса на этих четырёх частях нет —
// проверено на живом узле, а не предположено по аналогии с кнопкой.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// ТИП пропов — только тип: `import type` стирается сборкой, и подпуть `./passport`
// остаётся данными без Solid. Нужен, чтобы ключи настроек сверялись с настоящими пропами.
import type { CheckboxProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

// Словарь состояний ОДИН на все четыре адресуемые части: `getRootProps`, `getLabelProps`,
// `getControlProps`, `getIndicatorProps` спредят один и тот же объект `dataAttrs`
// (`checkbox.connect.mjs`) — состояние чекбокса видно целиком на каждом его узле, а не по частям.

/** Отмечен — словарный атрибут с тремя значениями, здесь первое из трёх. */
const checked = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
} as const satisfies PassportState;

/** Не отмечен — то же состояние, второе значение. Приезжает всегда, когда не отмечен и не «отчасти». */
const unchecked = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
} as const satisfies PassportState;

/** Отмечен ОТЧАСТИ — третье значение того же атрибута: часть вложенных отмечена, часть нет. */
const indeterminate = {
  name: "indeterminate",
  mark: { kind: "attribute", name: "data-state", value: "indeterminate" },
} as const satisfies PassportState;

/** Отключён — данными, а не нативным `disabled`: узлы `label`/`div`/`span` его не несут. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

/** Только для чтения — отметку видно, переключить нельзя, в отличие от отключённого — не тускло. */
const readOnly = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
} as const satisfies PassportState;

/** Невалиден — форма отвергла значение; чекбоксу нечем сказать почему, только что. */
const invalid = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
} as const satisfies PassportState;

/** Обязателен — форма его потребует при отправке. */
const required = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
} as const satisfies PassportState;

/** Наведение — Zag следит указателем сам (см. заголовок файла), не браузер: атрибут, не псевдокласс. */
const hover = {
  name: "hover",
  mark: { kind: "attribute", name: "data-hover" },
} as const satisfies PassportState;

/** Нажат — указатель зажат на чекбоксе. Тоже данные, тем же доводом, что у наведения. */
const active = {
  name: "active",
  mark: { kind: "attribute", name: "data-active" },
} as const satisfies PassportState;

/** Фокус — на СКРЫТОМ вводе, но виден здесь: Zag зеркалит его данными на видимые части. */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

/** Клавиатурный фокус — та же зеркальная запись, отдельным именем: `:focus-visible` навёл бы мимо. */
const focusVisible = {
  name: "focus-visible",
  mark: { kind: "attribute", name: "data-focus-visible" },
} as const satisfies PassportState;

/** Общий словарь — ссылкой, чтобы не разойтись между четырьмя частями молча. */
const states: readonly PassportState[] = [
  checked,
  unchecked,
  indeterminate,
  disabled,
  readOnly,
  invalid,
  required,
  hover,
  active,
  focus,
  focusVisible,
];

/**
 * Паспорт чекбокса — анатомия плюс то, чего анатомия не знает.
 *
 * Корень — `label`: клик по подписи переключает чекбокс тем же узлом, что несёт адрес и
 * состояние, — так устроил Zag (`getRootProps()` нормализует именно `label`).
 */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states },
    { name: "control", states },
    {
      name: "indicator",
      states,
      // Видимость решает `hidden` (кит прячет узел, когда не отмечен и не «отчасти») — паспорту
      // это не сообщается отдельным полем: `hidden` не адресный атрибут и не состояние вида, это
      // то же самое `checked`/`indeterminate`, вычисленное китом за потребителя, — второе
      // объявление того же факта развело бы правило скина и правило видимости в источнике.
    },
    { name: "label", states },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // Настроек из закрытого перечня чекбокс не принимает: `disabled`/`invalid`/`required`/
  // `readOnly` уже объявлены СОСТОЯНИЯМИ (они не выбор автора вида, а факт формы), а оси вроде
  // `orientation` у одиночного чекбокса нет — она появится у `CheckboxGroup`, не здесь.
  settings: defineSettings<CheckboxProps>()({}),
});
