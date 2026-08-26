// ПАСПОРТ чекбокса (`PWEB-114`) — первый компонент ФОРМЫ, из Ark.
//
// Анатомия здесь НЕ объявляется: она приезжает готовой вместе с компонентом, тем же приёмом,
// что у гармошки (`accordion.anatomy.ts`). Физически она живёт в `@zag-js/checkbox/anatomy` —
// подпуть без Solid и без машины состояний, только объявление частей; Ark свою `checkboxAnatomy`
// берёт ОТТУДА ЖЕ. Через `@ark-ui/solid/anatomy` не берём по тому же довод, что и у гармошки:
// у этого подпути есть ветка `solid` с файлом `.jsx`, и читатель паспорта без Solid (`packages/
// assembly`) упал бы на «Unknown file extension .jsx».
//
// Анатомия несёт ЧЕТЫРЕ части — `root · label · control · indicator` — и добавка покрывает их
// РОВНО (проверено: `Object.keys(anatomy.build())`, не документацией пакета — тип-декларация
// внутри `@ark-ui/solid` называет ещё и `group`, для `CheckboxGroup`, но у САМОСТОЯТЕЛЬНОГО
// `@zag-js/checkbox`, откуда анатомия взята физически, этой части нет вовсе; расхождение снято
// чтением рантайма, а не типов). `CheckboxGroup` — отдельный компонент, вне предмета `PWEB-114`
// в любом случае: его паспорт заведётся своим объявлением, когда компонент появится.
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
// проверено на живом узле (`checkbox.test.tsx`), а не предположено по аналогии с кнопкой.

import { anatomy as checkboxAnatomy } from "@zag-js/checkbox/anatomy";

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
// ТИП пропов — только тип: `import type` стирается сборкой, и подпуть `./passport`
// остаётся данными без Solid. Нужен, чтобы ключи настроек сверялись с настоящими пропами.
import type { CheckboxProps } from "./checkbox.jsx";

/** Части и адреса — взятые, не наши. Ровно четыре, и добавка ниже покрывает их все. */
export const anatomy = checkboxAnatomy;

/** Адреса частей: `attrs` для узла, `selector` для стиля. Считаются один раз — они статичны. */
export const parts = anatomy.build();

// Словарь состояний ОДИН на все четыре адресуемые части: `getRootProps`, `getLabelProps`,
// `getControlProps`, `getIndicatorProps` спредят один и тот же объект `dataAttrs`
// (`checkbox.connect.mjs`) — состояние чекбокса видно целиком на каждом его узле, а не по частям.

/** Отмечен — словарный атрибут с тремя значениями, здесь первое из трёх. */
const checked: PassportState = {
  name: "checked",
  mark: { kind: "attribute", name: "data-state", value: "checked" },
};

/** Не отмечен — то же состояние, второе значение. Приезжает всегда, когда не отмечен и не «отчасти». */
const unchecked: PassportState = {
  name: "unchecked",
  mark: { kind: "attribute", name: "data-state", value: "unchecked" },
};

/** Отмечен ОТЧАСТИ — третье значение того же атрибута: часть вложенных отмечена, часть нет. */
const indeterminate: PassportState = {
  name: "indeterminate",
  mark: { kind: "attribute", name: "data-state", value: "indeterminate" },
};

/** Отключён — данными, а не нативным `disabled`: узлы `label`/`div`/`span` его не несут. */
const disabled: PassportState = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
};

/** Только для чтения — отметку видно, переключить нельзя, в отличие от отключённого — не тускло. */
const readOnly: PassportState = {
  name: "readonly",
  mark: { kind: "attribute", name: "data-readonly" },
};

/** Невалиден — форма отвергла значение; чекбоксу нечем сказать почему, только что. */
const invalid: PassportState = {
  name: "invalid",
  mark: { kind: "attribute", name: "data-invalid" },
};

/** Обязателен — форма его потребует при отправке. */
const required: PassportState = {
  name: "required",
  mark: { kind: "attribute", name: "data-required" },
};

/** Наведение — Zag следит указателем сам (см. заголовок файла), не браузер: атрибут, не псевдокласс. */
const hover: PassportState = {
  name: "hover",
  mark: { kind: "attribute", name: "data-hover" },
};

/** Нажат — указатель зажат на чекбоксе. Тоже данные, тем же доводом, что у наведения. */
const active: PassportState = {
  name: "active",
  mark: { kind: "attribute", name: "data-active" },
};

/** Фокус — на СКРЫТОМ вводе, но виден здесь: Zag зеркалит его данными на видимые части. */
const focus: PassportState = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
};

/** Клавиатурный фокус — та же зеркальная запись, отдельным именем: `:focus-visible` навёл бы мимо. */
const focusVisible: PassportState = {
  name: "focus-visible",
  mark: { kind: "attribute", name: "data-focus-visible" },
};

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
  settings: defineSettings<CheckboxProps>({}),
});

/** Срез РЕДАКТОРА (`PWEB-115`, `PWEB-118`) — назначения человеку, род, группа, вложенность, сборка. */
export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "inputs",
  variantAxis: {
    means: "имя вариации чекбокса; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts: {
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
  },
  assemblies: [
    {
      name: "basic",
      means: "чекбокс с подписью, управляющей рамкой и указателем",
      tree: {
        part: "root",
        children: [
          {
            part: "control",
            children: [{ part: "indicator", children: [{ genus: "text", value: "✓" }] }],
          },
          { part: "label", children: [{ genus: "text", value: "Согласен с условиями" }] },
        ],
      },
    },
  ],
});
