import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type TablePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sortStateMeans = {
  ascending: { means: "эта колонка сейчас отсортирована по возрастанию" },
  descending: { means: "эта колонка сейчас отсортирована по убыванию" },
  none: { means: "эта колонка умеет сортироваться, но сейчас не она отсортирована" },
} satisfies PassportPartEditorInfo<TablePart>["states"];

const checkboxStateMeans = {
  checked: { means: "отмечен" },
  disabled: { means: "этот чекбокс нельзя использовать" },
  hover: { means: "указатель наведён на этот чекбокс" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
  active: { means: "этот чекбокс нажат и удерживается" },
} satisfies PassportPartEditorInfo<TablePart>["states"];

const pinnedStateMeans = {
  "pinned-start": { means: "колонка закреплена у начала — не уезжает при горизонтальном скролле" },
  "pinned-end": { means: "колонка закреплена у конца — не уезжает при горизонтальном скролле" },
} satisfies PassportPartEditorInfo<TablePart>["states"];

export const parts: Readonly<Record<TablePart, PassportPartEditorInfo<TablePart>>> = {
  root: {
    means: "таблица целиком",
    states: {},
    accepts: [
      { kind: "component", name: "caption" },
      { kind: "component", name: "head" },
      { kind: "component", name: "body" },
    ],
  },
  caption: {
    means: "собственная подпись таблицы — что она показывает",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  head: {
    means: "оборачивает строку(и) заголовков",
    states: {},
    accepts: [{ kind: "component", name: "headRow" }],
  },
  headRow: {
    means: "одна строка заголовков колонок",
    states: {},
    accepts: [{ kind: "component", name: "headerCell" }],
  },
  headerCell: {
    means: "заголовок одной колонки — несёт вид сортировки и закрепления для неё, есть кнопка внутри или нет",
    states: { ...sortStateMeans, ...pinnedStateMeans },
    accepts: [
      { kind: "component", name: "headerSortTrigger" },
      { kind: "component", name: "headerSelectTrigger" },
      { kind: "content", genus: "text" },
    ],
  },
  headerSortTrigger: {
    means: "кнопка, переключающая сортировку этой колонки — настоящая кнопка, отдельная от ячейки заголовка, чтобы несортируемая колонка могла просто её не нести",
    states: {
      ...sortStateMeans,
      disabled: { means: "эта колонка не умеет сортироваться — поведения кнопки нет, только нативный вид disabled" },
      hover: { means: "указатель наведён на эту кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "эта кнопка нажата и удерживается" },
    },
    variables: {
      "--sort-index": { means: "приоритет этой колонки в мультисортировке, считая с 1 — не выставлена, пока колонка не отсортирована" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  headerSelectTrigger: {
    means: "чекбокс «выбрать все строки» в заголовке — отмечен целиком, частично (indeterminate) или пусто",
    states: {
      ...checkboxStateMeans,
      indeterminate: { means: "выбраны не все строки, но и не ноль" },
    },
    accepts: [],
  },
  body: {
    means: "оборачивает строки данных",
    states: {},
    accepts: [{ kind: "component", name: "row" }],
  },
  row: {
    means: "одна строка данных — несёт выбор, если включён; закрепление строк и группировка пока нет",
    states: {
      selected: { means: "эта строка выбрана" },
    },
    accepts: [{ kind: "component", name: "cell" }],
  },
  cell: {
    means: "одна ячейка — содержимое даёт потребитель, как и у любой другой части кита",
    states: pinnedStateMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  rowSelectTrigger: {
    means: "чекбокс выбора одной строки",
    states: checkboxStateMeans,
    accepts: [],
  },
};
