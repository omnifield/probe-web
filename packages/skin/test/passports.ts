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

import { createAnatomy } from "@zag-js/anatomy";

import {
  definePassport,
  type ComponentPassport,
  type PassportSetting,
} from "../src/model.js";

/** Составной компонент: есть предок, есть вложенные части, есть состояния на обоих уровнях. */
const fieldAnatomy = createAnatomy("field").parts("root", "control", "label");

export const fieldPassport = definePassport({
  anatomy: fieldAnatomy,
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  root: "root",
  parts: [
    {
      name: "root",
      means: "поле целиком",
      states: [
        { name: "disabled", means: "править нельзя", mark: { kind: "attribute", name: "data-disabled" } },
        { name: "invalid", means: "значение не прошло проверку", mark: { kind: "attribute", name: "data-invalid" } },
      ],
      accepts: [
        { kind: "part", name: "label" },
        { kind: "part", name: "control" },
      ],
    },
    {
      name: "control",
      means: "то, во что вводят",
      states: [
        { name: "focus", means: "фокус на вводе", mark: { kind: "attribute", name: "data-focus" } },
        { name: "hover", means: "указатель над вводом", mark: { kind: "pseudo", name: ":hover" } },
      ],
    },
    {
      name: "label",
      means: "подпись поля",
      states: [],
      // ПЕРЕМЕННАЯ, КОТОРУЮ СТАВИТ ПОТРЕБИТЕЛЬ (`PWEB-93`). Живой кит объявляет только свои,
      // `setBy: "kit"`, — второй случай на нём не проверяется вовсе. Поле пробы затем и заведено:
      // оно закрывает то, чего у живого компонента сегодня нет.
      //
      // Выравнивание подписей в столбец делает тот, кто ставит поля рядом: одно поле про соседей
      // не знает и знать не может. Значит ширину объявляет паспорт, а кладёт потребитель.
      variables: [
        {
          name: "--label-width",
          means: "ширина подписи — её задаёт тот, кто выравнивает поля в столбец",
          setBy: "consumer",
        },
      ],
    },
  ],
  variantAxis: {
    means: "имя вариации поля",
    mark: { kind: "attribute", name: "data-variant" },
  },
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
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "actions",
  root: "root",
  parts: [
    {
      name: "root",
      means: "кнопка целиком — один узел",
      states: [
        { name: "hover", means: "указатель над кнопкой", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          means: "фокус пришёл с клавиатуры",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", means: "кнопку держат нажатой", mark: { kind: "pseudo", name: ":active" } },
        {
          name: "disabled",
          means: "нажать нельзя",
          mark: { kind: "attribute", name: "data-disabled" },
        },
        {
          name: "busy",
          means: "работа идёт",
          mark: { kind: "attribute", name: "aria-busy", value: "true" },
        },
        {
          name: "expanded",
          means: "кнопка раскрыла то, чем управляет",
          mark: { kind: "attribute", name: "data-expanded" },
        },
        {
          name: "pressed",
          means: "кнопка-переключатель нажата",
          mark: { kind: "attribute", name: "data-pressed" },
        },
      ],
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
  ],
  variantAxis: {
    means: "имя вариации кнопки",
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: {},
  assembly: {
    means: "кнопка с подписью",
    tree: { part: "root", children: [{ genus: "text", value: "Кнопка" }] },
  },
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
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "layout",
  root: "root",
  parts: [
    {
      name: "root",
      means: "плоскость — отделяет содержимое от того, что под ним",
      states: [],
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
    },
  ],
  variantAxis: {
    means: "имя вариации поверхности",
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: {},
  assembly: {
    means: "поверхность с содержимым",
    tree: { part: "root", children: [{ genus: "text", value: "Поверхность" }] },
  },
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
const open = { name: "open", means: "раздел раскрыт", mark: { kind: "attribute", name: "data-state", value: "open" } } as const;

const disabled = {
  name: "disabled",
  means: "раздел отключён",
  mark: { kind: "attribute", name: "data-disabled" },
} as const;

/** Раскрытость СОДЕРЖИМОГО — то же состояние, с названной ненадёжностью признака (`PWEB-97`). */
const openContent = {
  ...open,
  absentWhen:
    "раздел раскрылся без анимации: раскрывашка снимает признак целиком, и у раздела, " +
    "открытого с самого начала, признака нет вовсе",
};

const closed = {
  name: "closed",
  means: "раздел закрыт, узел на месте",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const;

const focus = { name: "focus", means: "фокус внутри раздела", mark: { kind: "attribute", name: "data-focus" } } as const;

const orientationSetting: PassportSetting = {
  means: "как разложены разделы",
  values: {
    kind: "choice",
    options: [
      { value: "vertical", means: "сверху вниз" },
      { value: "horizontal", means: "слева направо" },
    ],
  },
  byDefault: "vertical",
  mark: { kind: "attribute", name: "data-orientation" },
};

export const accordionPassport: ComponentPassport = definePassport({
  anatomy: accordionAnatomy,
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  group: "disclosure",
  root: "root",
  parts: [
    { name: "root", means: "набор разделов целиком", states: [], accepts: [{ kind: "part", name: "item" }] },
    {
      name: "item",
      means: "один раздел",
      states: [open, disabled, focus],
      accepts: [
        { kind: "part", name: "itemTrigger" },
        { kind: "part", name: "itemContent" },
      ],
    },
    {
      name: "itemTrigger",
      means: "кнопка раздела",
      states: [
        open,
        focus,
        { name: "disabled", means: "кнопка отключена", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", means: "указатель над кнопкой", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          means: "фокус пришёл с клавиатуры",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", means: "кнопку держат нажатой", mark: { kind: "pseudo", name: ":active" } },
      ],
      accepts: [
        { kind: "part", name: "itemIndicator" },
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
    {
      name: "itemContent",
      means: "содержимое раздела",
      states: [openContent, closed, disabled, focus],
      variables: [
        { name: "--height", means: "измеренная высота раскрытого содержимого", setBy: "kit" },
        { name: "--width", means: "измеренная ширина раскрытого содержимого", setBy: "kit" },
      ],
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
    },
    {
      name: "itemIndicator",
      means: "указатель раскрытия",
      states: [open, disabled, focus],
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
  ],
  variantAxis: {
    means: "имя вариации, которое даёт гармошке человек в редакторе",
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: {
    orientation: orientationSetting,
    multiple: { means: "можно ли держать раскрытыми несколько разделов сразу", values: { kind: "flag" }, byDefault: false },
    collapsible: {
      means: "можно ли закрыть последний раскрытый раздел",
      values: { kind: "flag" },
      byDefault: false,
    },
  },
  assembly: {
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
