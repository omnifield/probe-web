// EDITOR-ONLY per-part taxonomy for the tree view — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one
// file, exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read
// while building `../entity/`.
//
// `means` filled in below (Russian, same convention as `flow`/`grid`/`icon`/`surface`/`checkbox`
// — the newer half of the kit). Checked against `../entity/passport.ts` and the installed
// `@zag-js/tree-view` connector, not against the ark-ui.com docs alone: the docs' own demo CSS
// references a `--height` variable on `branchContent` that the INSTALLED connector (`1.43.1`)
// never sets — `getBranchContentProps` only ever writes `hidden: !nodeState.expanded`, no
// measured size. That is why `branchContent` gets no `--height`-driven "means" here and why the
// recipe next to this file does not attempt to animate it: the passport already reflects the real
// connector, not the docs' shared boilerplate.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type TreeViewPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "ветка раскрыта — её содержимое видно" },
  closed: { means: "ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`" },
} satisfies PassportPartEditorInfo<TreeViewPart>["states"];

const hoverActiveMeans = {
  hover: { means: "указатель наведён на строку" },
  active: { means: "строка нажата указателем" },
} satisfies PassportPartEditorInfo<TreeViewPart>["states"];

export const parts: Readonly<Record<TreeViewPart, PassportPartEditorInfo<TreeViewPart>>> = {
  root: {
    means: "дерево целиком — один узел, оборачивающий подпись и сам список",
    states: {},
    accepts: [
      { kind: "part", name: "label" },
      { kind: "part", name: "tree" },
    ],
  },
  label: {
    means: "подпись дерева — заголовок над списком",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  tree: {
    means: "список узлов верхнего уровня — `role=\"tree\"`; вложенные листья и ветки строятся рекурсивно",
    states: {},
    accepts: [
      { kind: "part", name: "item" },
      { kind: "part", name: "branch" },
    ],
  },
  item: {
    means: "один лист — конечный узел без потомков; кликабельная и фокусируемая строка (roving tabindex)",
    states: {
      focus: { means: "реальный фокус клавиатуры/мыши стоит на этом листе" },
      selected: { means: "лист входит в текущее выделение" },
      disabled: { means: "лист отключён — клик по нему не выделяет и не переключает" },
      renaming: { means: "подпись листа сейчас редактируется (`F2` или `startRenaming`)" },
      checked: { means: "лист отмечен целиком — для дерева с чекбоксами" },
      indeterminate: { means: "отмечена только часть — у листа своих потомков нет, но отметку можно задать извне тем же атрибутом, что и у ветки" },
    },
    variables: { "--depth": { means: "глубина вложенности листа — от неё считается отступ строки" } },
    accepts: [
      { kind: "part", name: "itemText" },
      { kind: "part", name: "itemIndicator" },
      { kind: "part", name: "nodeCheckbox" },
      { kind: "part", name: "nodeRenameInput" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemText: {
    means: "подпись листа",
    states: { disabled: { means: "лист отключён" }, selected: { means: "лист выделен" }, focus: { means: "фокус стоит на этом листе" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemIndicator: {
    means: "отметка выделения листа — кит прячет её атрибутом `hidden`, пока лист не выделен; графику кладёт потребитель",
    states: { disabled: { means: "лист отключён" }, selected: { means: "лист выделен" }, focus: { means: "фокус стоит на этом листе" } },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  branch: {
    means: "одна ветка — узел с потомками, вложенными в `branchContent`",
    states: {
      selected: { means: "ветка входит в текущее выделение" },
      disabled: { means: "ветка отключена — раскрыть, выделить или отметить её нельзя" },
      loading: { means: "ветка подгружает своих потомков (`loadChildren`)" },
      ...openClosedMeans,
    },
    variables: { "--depth": { means: "глубина вложенности ветки — от неё считается отступ строки" } },
    accepts: [
      { kind: "part", name: "branchControl" },
      { kind: "part", name: "branchContent" },
    ],
  },
  branchControl: {
    means: "кликабельная и фокусируемая строка ветки — настоящий фокус живёт здесь (roving tabindex), не на `branch`",
    states: {
      ...openClosedMeans,
      disabled: { means: "ветка отключена" },
      selected: { means: "ветка входит в текущее выделение" },
      focus: { means: "реальный фокус стоит на этой строке" },
      renaming: { means: "подпись ветки сейчас редактируется (`F2` или `startRenaming`)" },
      checked: { means: "ветка отмечена целиком — для дерева с чекбоксами" },
      indeterminate: { means: "отмечена только часть потомков ветки" },
      loading: { means: "ветка подгружает своих потомков" },
      ...hoverActiveMeans,
    },
    accepts: [
      { kind: "part", name: "branchIndicator" },
      { kind: "part", name: "branchText" },
      { kind: "part", name: "nodeCheckbox" },
      { kind: "part", name: "nodeRenameInput" },
    ],
  },
  branchText: {
    means: "подпись ветки",
    states: { ...openClosedMeans, disabled: { means: "ветка отключена" }, loading: { means: "ветка подгружает своих потомков" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  branchIndicator: {
    means: "индикатор раскрытия — обычно стрелка, которую скин поворачивает по `data-state`; графику кладёт потребитель",
    states: {
      ...openClosedMeans,
      disabled: { means: "ветка отключена" },
      selected: { means: "ветка входит в текущее выделение" },
      focus: { means: "реальный фокус стоит на строке ветки" },
      loading: { means: "ветка подгружает своих потомков" },
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  branchTrigger: {
    means: "отдельная кнопка переключения раскрытия — `role=\"button\"` на `<div>`; клавиатурный фокус на неё никогда не приходит, он остаётся на `branchControl`. Нативный `disabled` здесь отражает не отключённость ветки, а именно `loading` — сама отключённость приходит своим атрибутом `data-disabled`",
    states: {
      ...openClosedMeans,
      disabled: { means: "ветка отключена — клик по этой кнопке не раскрывает и не закрывает её" },
      loading: { means: "ветка подгружает своих потомков; нативный `disabled` кнопки в этот момент тоже включён" },
      ...hoverActiveMeans,
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  branchContent: {
    means: "контейнер потомков ветки — виден только пока она раскрыта; при закрытии скрывается целиком атрибутом `hidden`, без измеренной высоты и без анимации (в отличие от аккордеона — у этой части нет `--height`)",
    states: openClosedMeans,
    accepts: [
      { kind: "part", name: "branchIndentGuide" },
      { kind: "part", name: "item" },
      { kind: "part", name: "branch" },
    ],
  },
  branchIndentGuide: {
    means: "вертикальная направляющая линия на глубине узла — чисто структурный элемент, своей графики не несёт",
    states: {},
    accepts: [],
  },
  nodeCheckbox: {
    means: "чекбокс узла — работает и на листе, и на ветке; кликабелен, но сам никогда не получает клавиатурный фокус (фокус всегда остаётся на строке)",
    states: {
      checked: { means: "узел отмечен целиком" },
      unchecked: { means: "узел не отмечен" },
      indeterminate: { means: "отмечена только часть потомков узла" },
      disabled: { means: "узел отключён" },
      ...hoverActiveMeans,
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  nodeRenameInput: {
    means: "настоящее поле ввода переименования — показывается только пока узел в режиме переименования (`F2` или `startRenaming`)",
    states: {},
    accepts: [],
  },
};
