// ПАСПОРТА ДЛЯ ПРОБ.
//
// ## Больше не живые (`PWEB-110`)
//
// До переезда формы паспорта в `packages/skin` (`PWEB-110`, пересматривает `PWEB-26`) кнопка и
// гармошка брались ЖИВЫМИ, из кита: «если форма подошла компоненту, которого в чужом ките не
// существует, она подойдёт любому» (страница «Основания»). Довод не отменился — он остаётся
// верным для `fieldPassport`, — но `packages/ui` больше не может быть даже devDependency зоны:
// цикл разорван физически, а не по факту.
//
// Поэтому кнопка, гармошка и поверхность здесь — ТОЧНЫЕ РЕПЛИКИ настоящих объявлений кита, той
// же функцией (`definePassport`/`createAnatomy`), с теми же именами частей, состояний, осей и
// оговорок. Сверено построчно с `packages/ui/src/{button,accordion,surface}/*.anatomy.ts` в
// момент переезда (2026-08-25) — искать расхождение, если что-то здесь вдруг не совпадёт с
// китом, следует ТАМ, а не наоборот: реплика существует ради проб механики, а не как вторая
// правда о ките.
//
// Довод «обкатка на компоненте, которого в чужом ките нет» этим не потерян, а стал ЯВНЫМ: раз
// форма подходит компоненту, объявленному ЗДЕСЬ, руками, без единой связи с китом, — она
// подходит любому поставщику, а не только тому, кто её выдумал.
//
// ## Каждый паспорт — ДВА экспорта (`PWEB-115`)
//
// `xPassport` — срез рантайма, ровно то, что читает `generateSkinCss`. `xEditorInfo` — срез
// редактора, ОТДЕЛЬНОЙ привязкой и помеченный `/*@__PURE__*/`: рецепт объявления, которому здесь
// же следуют, — в шапке `passport-editor.ts`. Пробы механики берут первое; пробы среза
// редактора (`passport-editor.test.ts`) и обогащённого текста покрытия (`coverage.test.ts`) —
// второе, отдельным доводом.

import { createAnatomy } from "@zag-js/anatomy";

import { definePassport, type ComponentPassport, type PassportSetting } from "../src/model.js";
import { defineEditorInfo } from "../src/editor.js";

/** Составной компонент: есть предок, есть вложенные части, есть состояния на обоих уровнях. */
const fieldAnatomy = createAnatomy("field").parts("root", "control", "label");

export const fieldPassport = definePassport({
  anatomy: fieldAnatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
        { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } },
      ],
    },
    {
      name: "control",
      states: [
        { name: "focus", mark: { kind: "attribute", name: "data-focus" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
      ],
    },
    {
      name: "label",
      states: [],
      // ПЕРЕМЕННАЯ, КОТОРУЮ СТАВИТ ПОТРЕБИТЕЛЬ (`PWEB-93`). Живой кит объявляет только свои,
      // `setBy: "kit"`, — второй случай на нём не проверяется вовсе. Поле пробы затем и заведено:
      // оно закрывает то, чего у живого компонента сегодня нет.
      //
      // Выравнивание подписей в столбец делает тот, кто ставит поля рядом: одно поле про соседей
      // не знает и знать не может. Значит ширину объявляет паспорт, а кладёт потребитель.
      variables: [{ name: "--label-width", setBy: "consumer" }],
    },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  // НАСТРОЕК У ПРОБНОГО ПОЛЯ НЕТ, и пустая запись это УТВЕРЖДАЕТ, а не умалчивает (`PWEB-91`).
  //
  // Отсутствующее поле и «настроек нет» неразличимы, а для паспорта, который читает машина,
  // разница несущая: перечень настроек уезжает в редактор, и «нет настроек» там рабочий ответ,
  // а «не объявлено» — дыра. Довод тот же, которым здесь закрывали пустой словарь значений
  // (`PWEB-64`): пустое — это ответ, если его дали.
  //
  // Выдумывать нечего: поле пробы существует ради адресации — предок, вложенные части, состояния
  // на обоих уровнях, — и ни одной настройки не принимает.
  settings: {},
});

export const fieldEditorInfo = /*@__PURE__*/ defineEditorInfo(fieldPassport, {
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  variantAxis: { means: "имя вариации поля" },
  parts: {
    root: {
      means: "поле целиком",
      accepts: [
        { kind: "part", name: "label" },
        { kind: "part", name: "control" },
      ],
      states: {
        disabled: { means: "править нельзя" },
        invalid: { means: "значение не прошло проверку" },
      },
    },
    control: {
      means: "то, во что вводят",
      states: {
        focus: { means: "фокус на вводе" },
        hover: { means: "указатель над вводом" },
      },
    },
    label: {
      means: "подпись поля",
      variables: {
        "--label-width": { means: "ширина подписи — её задаёт тот, кто выравнивает поля в столбец" },
      },
    },
  },
});

/**
 * Паспорт КНОПКИ — реплика `packages/ui/src/button/button.anatomy.ts`.
 *
 * Часть одна: кнопка рендерит один узел, подпись и значок кладёт потребитель. Семь состояний,
 * три из них псевдоклассы (браузер их и знает — наведение, клавиатурный фокус, нажатость),
 * остальные атрибутами: отключённость ставит сама кнопка, занятость — потребитель, раскрытие и
 * нажатость (переключатель) — внешний компонент при композиции.
 */
const buttonAnatomy = createAnatomy("button").parts("root");

export const buttonPassport: ComponentPassport = definePassport({
  anatomy: buttonAnatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
        { name: "busy", mark: { kind: "attribute", name: "aria-busy", value: "true" } },
        { name: "expanded", mark: { kind: "attribute", name: "data-expanded" } },
        { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } },
      ],
    },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

export const buttonEditorInfo = /*@__PURE__*/ defineEditorInfo(buttonPassport, {
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "actions",
  variantAxis: { means: "имя вариации кнопки" },
  parts: {
    root: {
      means: "кнопка целиком — один узел",
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
      states: {
        hover: { means: "указатель над кнопкой" },
        "focus-visible": { means: "фокус пришёл с клавиатуры" },
        active: { means: "кнопку держат нажатой" },
        disabled: { means: "нажать нельзя" },
        busy: { means: "работа идёт" },
        expanded: { means: "кнопка раскрыла то, чем управляет" },
        pressed: { means: "кнопка-переключатель нажата" },
      },
    },
  },
  assemblies: [
    {
      means: "кнопка с подписью",
      tree: { part: "root", children: [{ genus: "text", value: "Кнопка" }] },
    },
  ],
});

/**
 * Паспорт ПОВЕРХНОСТИ — реплика `packages/ui/src/surface/surface.anatomy.ts`.
 *
 * Часть одна, состояний нет ни одного: поверхность не хранит ничего, чем её вид мог бы
 * отличаться. Ось вариаций несёт весь вид компонента.
 */
const surfaceAnatomy = createAnatomy("surface").parts("root");

export const surfacePassport: ComponentPassport = definePassport({
  anatomy: surfaceAnatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

export const surfaceEditorInfo = /*@__PURE__*/ defineEditorInfo(surfacePassport, {
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "layout",
  variantAxis: { means: "имя вариации поверхности" },
  parts: {
    root: {
      means: "плоскость — отделяет содержимое от того, что под ним",
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
    },
  },
  assemblies: [
    {
      means: "поверхность с содержимым",
      tree: { part: "root", children: [{ genus: "text", value: "Поверхность" }] },
    },
  ],
});

/**
 * Паспорт ГАРМОШКИ — реплика `packages/ui/src/accordion/accordion.anatomy.ts`.
 *
 * Берётся ради ДВУХ свойств, ради которых её и берёт вся механика PWEB-97…PWEB-105:
 *
 *  • у СОДЕРЖИМОГО раскрытость объявлена с оговоркой `absentWhen` — признак приезжает не всегда;
 *    у ПУНКТА то же имя состояния объявлено БЕЗ оговорки — признак надёжен. Разница между ними
 *    видна только на паре «то же имя, разное объявление», и подделать её проще и хуже: граница
 *    «вид против движения» стоит ради настоящего различия, а не выдуманного;
 *  • `--height`/`--width` объявлены на содержимом с `setBy: "kit"`, и настройка `orientation`
 *    несёт `mark` — оба свойства понадобились не сразу (`PWEB-89`, `PWEB-104`), и обкатывать их
 *    заново на выдуманном компоненте было бы менее честно, чем повторить настоящее объявление.
 */
const accordionAnatomy = createAnatomy("accordion").parts(
  "root",
  "item",
  "itemTrigger",
  "itemContent",
  "itemIndicator",
);

/** Раскрытость — общий словарный атрибут; стоит на пункте, содержимом и указателе. */
const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const;

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const;

/** Раскрытость СОДЕРЖИМОГО — то же состояние, с названной ненадёжностью признака (`PWEB-97`). */
const openContent = {
  ...open,
  absentWhen:
    "раздел раскрылся без анимации: раскрывашка снимает признак целиком, и у раздела, " +
    "открытого с самого начала, признака нет вовсе",
};

const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const;

const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const;

const orientationSetting: PassportSetting = {
  values: {
    kind: "choice",
    options: [{ value: "vertical" }, { value: "horizontal" }],
  },
  byDefault: "vertical",
  mark: { kind: "attribute", name: "data-orientation" },
};

export const accordionPassport: ComponentPassport = definePassport({
  anatomy: accordionAnatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "item", states: [open, disabled, focus] },
    {
      name: "itemTrigger",
      states: [
        open,
        focus,
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "itemContent",
      states: [openContent, closed, disabled, focus],
      variables: [
        { name: "--height", setBy: "kit" },
        { name: "--width", setBy: "kit" },
      ],
    },
    {
      name: "itemIndicator",
      states: [open, disabled, focus],
    },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {
    orientation: orientationSetting,
    multiple: { values: { kind: "flag" }, byDefault: false },
    collapsible: { values: { kind: "flag" }, byDefault: false },
  },
});

export const accordionEditorInfo = /*@__PURE__*/ defineEditorInfo(accordionPassport, {
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "disclosure",
  variantAxis: { means: "имя вариации, которое даёт гармошке человек в редакторе" },
  parts: {
    root: { means: "набор разделов целиком", accepts: [{ kind: "part", name: "item" }] },
    item: {
      means: "один раздел",
      accepts: [
        { kind: "part", name: "itemTrigger" },
        { kind: "part", name: "itemContent" },
      ],
      states: {
        open: { means: "раздел раскрыт" },
        disabled: { means: "раздел отключён" },
        focus: { means: "фокус внутри раздела" },
      },
    },
    itemTrigger: {
      means: "кнопка раздела",
      accepts: [
        { kind: "part", name: "itemIndicator" },
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
      states: {
        open: { means: "раздел раскрыт" },
        focus: { means: "фокус внутри раздела" },
        disabled: { means: "кнопка отключена" },
        hover: { means: "указатель над кнопкой" },
        "focus-visible": { means: "фокус пришёл с клавиатуры" },
        active: { means: "кнопку держат нажатой" },
      },
    },
    itemContent: {
      means: "содержимое раздела",
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
      states: {
        open: { means: "раздел раскрыт" },
        closed: { means: "раздел закрыт, узел на месте" },
        disabled: { means: "раздел отключён" },
        focus: { means: "фокус внутри раздела" },
      },
      variables: {
        "--height": { means: "измеренная высота раскрытого содержимого" },
        "--width": { means: "измеренная ширина раскрытого содержимого" },
      },
    },
    itemIndicator: {
      means: "указатель раскрытия",
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
      states: {
        open: { means: "раздел раскрыт" },
        disabled: { means: "раздел отключён" },
        focus: { means: "фокус внутри раздела" },
      },
    },
  },
  settings: {
    orientation: {
      means: "как разложены разделы",
      options: {
        vertical: { means: "сверху вниз" },
        horizontal: { means: "слева направо" },
      },
    },
    multiple: { means: "можно ли держать раскрытыми несколько разделов сразу" },
    collapsible: { means: "можно ли закрыть последний раскрытый раздел" },
  },
  assemblies: [
    {
      means: "три раздела, первый раскрыт",
      tree: {
        part: "root",
        props: { defaultValue: ["раздел-1"] },
        children: [
          {
            part: "item",
            props: { value: "раздел-1" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Раздел 1" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              { part: "itemContent", children: [{ genus: "text", value: "Здесь лежит то, что раскрывают." }] },
            ],
          },
          {
            part: "item",
            props: { value: "раздел-2" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Раздел 2" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              { part: "itemContent", children: [{ genus: "text", value: "Второй раздел закрыт." }] },
            ],
          },
          {
            part: "item",
            props: { value: "раздел-3" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Раздел 3" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              { part: "itemContent", children: [{ genus: "text", value: "Третий раздел закрыт." }] },
            ],
          },
        ],
      },
    },
  ],
});

/** Реестр этой пробы — тем же ходом, каким его прежде отдавал `PASSPORTS` кита. */
const REGISTRY: Readonly<Record<string, ComponentPassport>> = {
  [fieldPassport.component]: fieldPassport,
  [buttonPassport.component]: buttonPassport,
  [surfacePassport.component]: surfacePassport,
  [accordionPassport.component]: accordionPassport,
};

/** Чем пробы находят паспорт по имени компонента. */
export function lookup(component: string): ComponentPassport | undefined {
  return REGISTRY[component];
}

/** Лукап, не знающий ни одного компонента, — для проверки именованных отказов. */
export function emptyLookup(): undefined {
  return undefined;
}
