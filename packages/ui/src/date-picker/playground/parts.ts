import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DatePickerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "панель календаря показана" },
  closed: { means: "панель календаря скрыта" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const viewMeans = {
  day: { means: "показана сетка дней — выбор даты напрямую" },
  month: { means: "показана сетка месяцев — выбор месяца, затем переход внутрь его дней" },
  year: { means: "показана сетка лет — выбор года, затем переход внутрь его месяцев" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
  active: { means: "эта кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

const tableSectionMeans = {
  ...viewMeans,
  disabled: { means: "весь пикер отключён" },
} satisfies PassportPartEditorInfo<DatePickerPart>["states"];

export const parts: Readonly<Record<DatePickerPart, PassportPartEditorInfo<DatePickerPart>>> = {
  root: {
    means: "пикер даты целиком — подпись, контрол и плавающий календарь вместе",
    states: {
      ...openClosedMeans,
      disabled: { means: "весь пикер отключён" },
      readonly: { means: "значение видно, изменить нельзя" },
      empty: { means: "значение ещё не выбрано" },
    },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "control" },
      { kind: "component", name: "positioner" },
    ],
  },
  label: {
    means: "собственная подпись пикера",
    states: {
      ...openClosedMeans,
      disabled: { means: "весь пикер отключён" },
      readonly: { means: "значение видно, изменить нельзя" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "оборачивает поле ввода и кнопки открытия/сброса — видимая строка, пока пикер закрыт",
    states: {
      disabled: { means: "весь пикер отключён" },
      empty: { means: "значение ещё не выбрано" },
    },
    accepts: [
      { kind: "component", name: "input" },
      { kind: "component", name: "trigger" },
      { kind: "component", name: "clearTrigger" },
    ],
  },
  input: {
    means: "поле ввода даты текстом — по одному на индекс в режиме диапазона/множественного выбора",
    states: {
      ...openClosedMeans,
      empty: { means: "значение ещё не выбрано" },
      invalid: { means: "форма отвергла значение" },
      disabled: { means: "это поле нельзя использовать" },
      readonly: { means: "значение видно, изменить нельзя" },
      required: { means: "форма потребует значение при отправке" },
    },
    accepts: [],
  },
  clearTrigger: {
    means: "сбрасывает выбранное значение — скрыт китом, пока ничего не выбрано",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  trigger: {
    means: "открывает или закрывает панель календаря",
    states: { ...openClosedMeans, empty: { means: "значение ещё не выбрано" }, disabled: { means: "эту кнопку нельзя использовать" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  content: {
    means: "плавающая панель — держит все виды",
    states: { ...openClosedMeans, inline: { means: "показан прямо в потоке страницы, не всплывает над ней" } },
    accepts: [{ kind: "component", name: "view" }],
  },
  positioner: {
    means: "позиционирует плавающую панель относительно контрола — чистая обёртка, своего вида не несёт",
    states: {},
    variables: {
      "--reference-width": { means: "измеренная ширина контрола, к которому привязана панель" },
      "--reference-height": { means: "измеренная высота контрола, к которому привязана панель" },
      "--available-width": { means: "место, оставшееся до края области просмотра, по ширине" },
      "--available-height": { means: "место, оставшееся до края области просмотра, по высоте" },
    },
    accepts: [{ kind: "component", name: "content" }],
  },
  view: {
    means: "панель одного вида (день, месяц или год) — скрыта, пока активен другой",
    states: viewMeans,
    accepts: [
      { kind: "component", name: "viewControl" },
      { kind: "component", name: "table" },
    ],
  },
  viewControl: {
    means: "оборачивает собственную строку назад/вперёд/переключения вида",
    states: viewMeans,
    accepts: [
      { kind: "component", name: "prevTrigger" },
      { kind: "component", name: "viewTrigger" },
      { kind: "component", name: "nextTrigger" },
    ],
  },
  viewTrigger: {
    means: "переключает на следующий, более широкий вид (день → месяц → год)",
    states: { ...viewMeans, disabled: { means: "весь пикер отключён" } },
    accepts: [
      { kind: "component", name: "rangeText" },
      { kind: "content", genus: "text" },
    ],
  },
  rangeText: {
    means: "собственная подпись видимого диапазона (например, название месяца) — текст задаёт кит",
    states: {},
    accepts: [],
  },
  prevTrigger: {
    means: "сдвигает видимый диапазон назад",
    states: { disabled: { means: "сдвигать назад больше некуда" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  nextTrigger: {
    means: "сдвигает видимый диапазон вперёд",
    states: { disabled: { means: "сдвигать вперёд больше некуда" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  monthSelect: {
    means: "прыгает к нужному месяцу напрямую — нативный выпадающий список",
    states: { disabled: { means: "этот контрол нельзя использовать" } },
    accepts: [],
  },
  yearSelect: {
    means: "прыгает к нужному году напрямую — нативный выпадающий список",
    states: { disabled: { means: "этот контрол нельзя использовать" } },
    accepts: [],
  },
  table: {
    means: "сетка календаря — по одной на вид",
    states: tableSectionMeans,
    accepts: [
      { kind: "component", name: "tableHead" },
      { kind: "component", name: "tableBody" },
    ],
  },
  tableHead: {
    means: "оборачивает строку заголовка сетки",
    states: tableSectionMeans,
    accepts: [{ kind: "component", name: "tableRow" }],
  },
  tableHeader: {
    means: "собственная ячейка заголовка одного столбца (день недели, в дневном виде)",
    states: tableSectionMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  tableBody: {
    means: "оборачивает строки данных сетки",
    states: tableSectionMeans,
    accepts: [{ kind: "component", name: "tableRow" }],
  },
  tableRow: {
    means: "одна строка — либо строка заголовка дней недели, либо одна неделя (дневной вид) / одна строка месяцев или лет (другие виды)",
    states: tableSectionMeans,
    accepts: [
      { kind: "component", name: "tableHeader" },
      { kind: "component", name: "tableCell" },
    ],
  },
  tableCell: {
    means: "одна ячейка сетки — оборачивает кликабельный триггер внутри",
    states: { ...viewMeans, selected: { means: "собственное значение этой ячейки и есть выбранное сейчас (только в видах месяца/года)" } },
    accepts: [{ kind: "component", name: "tableCellTrigger" }],
  },
  tableCellTrigger: {
    means: "кликабельная поверхность внутри ячейки — выбирает эту дату/месяц/год",
    states: {
      ...viewMeans,
      disabled: { means: "эту ячейку нельзя выбрать" },
      selectable: { means: "эту ячейку вообще МОЖНО выбрать — базовое состояние, которое уточняют все остальные" },
      selected: { means: "собственное значение этой ячейки и есть выбранное сейчас" },
      focus: { means: "клавиатурный roving-фокус стоит на этой ячейке" },
      "outside-range": { means: "принадлежит соседнему месяцу/году, показана только для заполнения сетки" },
      "range-start": { means: "первая дата выбранного диапазона" },
      "range-end": { means: "последняя дата выбранного диапазона" },
      "in-range": { means: "попадает между началом и концом выбранного диапазона" },
      "in-hover-range": { means: "попадает между началом диапазона и тем, где сейчас наведён указатель (только в режиме диапазона)" },
      "hover-range-start": { means: "станет началом диапазона при следующем клике (только в режиме диапазона)" },
      "hover-range-end": { means: "станет концом диапазона при следующем клике (только в режиме диапазона)" },
      today: { means: "эта ячейка — сегодняшняя дата (только в дневном виде)" },
      unavailable: { means: "эту дату нельзя выбрать, например вне min/max (только в дневном виде)" },
      weekend: { means: "эта ячейка приходится на выходной (только в дневном виде)" },
      ...buttonPseudoMeans,
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  presetTrigger: {
    means: "прыгает сразу к именованному диапазону (например, «последние 7 дней»)",
    states: buttonPseudoMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  valueText: {
    means: "показывает выбранное значение(я) текстом, форматирует кит",
    states: {},
    accepts: [],
  },
};
