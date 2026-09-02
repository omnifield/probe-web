import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "узел раскрыт (ветка) — его содержимое видно" },
  closed: { means: "узел закрыт (ветка) — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`" },
} satisfies PassportPartEditorInfo<TreeViewPart>["states"];

const hoverActiveMeans = {
  hover: { means: "указатель наведён на строку" },
  active: { means: "строка нажата указателем" },
} satisfies PassportPartEditorInfo<TreeViewPart>["states"];

export const parts: Readonly<Record<TreeViewPart, PassportPartEditorInfo<TreeViewPart>>> = {
  root: {
    means: "дерево целиком — один узел",
    states: {},
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "один узел повтора — лист или ветка, решает сам компонент по данным",
    states: {
      focus: { means: "реальный фокус клавиатуры/мыши стоит на этом узле" },
      selected: { means: "узел входит в текущее выделение" },
      disabled: { means: "узел отключён" },
      renaming: { means: "подпись узла сейчас редактируется (`F2` или `startRenaming`)" },
      checked: { means: "узел отмечен целиком — для дерева с чекбоксами" },
      indeterminate: { means: "отмечена только часть потомков узла" },
      loading: { means: "узел — ветка, подгружает своих потомков (`loadChildren`)" },
      branch: { means: "узел — ветка (есть дети), а не лист; у листа этого атрибута просто нет" },
      ...openClosedMeans,
    },
    variables: {
      "--depth": { means: "глубина вложенности узла — от неё считается отступ строки" },
      "--active-color": {
        means: "цвет текста строки, если узел активен — узел выставляет себе сам, по своему selected",
      },
      "--active-weight": {
        means: "насыщенность текста строки на пути к активному — тот же приём, что и `--active-color`",
      },
    },
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "content" },
    ],
  },
  control: {
    means: "шапка узла — кликабельная и фокусируемая строка; своё содержимое решает потребитель",
    states: {
      ...openClosedMeans,
      disabled: { means: "узел отключён" },
      selected: { means: "узел входит в текущее выделение" },
      focus: { means: "реальный фокус стоит на этой строке" },
      renaming: { means: "подпись сейчас редактируется (`F2` или `startRenaming`)" },
      checked: { means: "узел отмечен целиком" },
      indeterminate: { means: "отмечена только часть потомков узла" },
      loading: { means: "узел — ветка, подгружает своих потомков" },
      ...hoverActiveMeans,
    },
    accepts: [
      { kind: "content", genus: "icon" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  controlIndicator: {
    means: "индикатор внутри шапки — раскрытие для ветки, выделение для листа; графику кладёт потребитель",
    states: {
      ...openClosedMeans,
      disabled: { means: "узел отключён" },
      selected: { means: "узел выделен" },
      focus: { means: "фокус стоит на этом узле" },
      loading: { means: "узел — ветка, подгружает своих потомков" },
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  content: {
    means: "открытый слот узла — своего вида не несёт, содержимое (в том числе ещё узлы) решает потребитель",
    states: {
      ...openClosedMeans,
    },
    variables: {
      "--height": { means: "измеренная высота содержимого ветки — по ней растёт/сжимается раскрытие" },
    },
    accepts: [
      { kind: "component", name: "item" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
};
