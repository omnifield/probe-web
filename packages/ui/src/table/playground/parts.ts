import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TablePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const sortStateMeans = {
  ascending: { means: "эта колонка сейчас отсортирована по возрастанию" },
  descending: { means: "эта колонка сейчас отсортирована по убыванию" },
  none: { means: "эта колонка умеет сортироваться, но сейчас не она отсортирована" },
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
    means: "заголовок одной колонки — несёт вид сортировки для неё, есть кнопка внутри или нет",
    states: sortStateMeans,
    accepts: [
      { kind: "component", name: "headerSortTrigger" },
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
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  body: {
    means: "оборачивает строки данных",
    states: {},
    accepts: [{ kind: "component", name: "row" }],
  },
  row: {
    means: "одна строка данных — v1 не несёт собственного вида (нет выбора, нет закрепления)",
    states: {},
    accepts: [{ kind: "component", name: "cell" }],
  },
  cell: {
    means: "одна ячейка — содержимое даёт потребитель, как и у любой другой части кита",
    states: {},
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
};
