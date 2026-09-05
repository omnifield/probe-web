import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type ListboxPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const disabledMeans = {
  disabled: { means: "весь лист отключён" },
} satisfies PassportPartEditorInfo<ListboxPart>["states"];

const selectionMeans = {
  checked: { means: "этот пункт выбран" },
  unchecked: { means: "этот пункт не выбран" },
  highlighted: { means: "клавиатура или указатель перешли на этот пункт, но ещё не выбрали его" },
  disabled: { means: "весь лист отключён" },
} satisfies PassportPartEditorInfo<ListboxPart>["states"];

export const parts: Readonly<Record<ListboxPart, PassportPartEditorInfo<ListboxPart>>> = {
  root: {
    means: "лист целиком — подпись, поле фильтра и список пунктов вместе",
    states: disabledMeans,
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "input" },
      { kind: "component", name: "content" },
      { kind: "component", name: "valueText" },
    ],
  },
  label: {
    means: "собственная подпись листа",
    states: disabledMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  input: {
    means: "необязательное поле фильтра/поиска — сужает, какие пункты показаны",
    states: disabledMeans,
    accepts: [],
  },
  content: {
    means: "оборачивает пункты — прокручиваемая, навигируемая область, всегда в разметке",
    states: { empty: { means: "показывать нечего" } },
    accepts: [
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "item" },
      { kind: "component", name: "empty" },
    ],
  },
  itemGroup: {
    means: "группирует связанные пункты под одной подписью",
    states: { ...disabledMeans, empty: { means: "в этой группе нет пунктов" } },
    accepts: [
      { kind: "component", name: "itemGroupLabel" },
      { kind: "component", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "подпись группы пунктов",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "один выбираемый пункт",
    states: selectionMeans,
    accepts: [
      { kind: "component", name: "itemText" },
      { kind: "component", name: "itemIndicator" },
    ],
  },
  itemText: {
    means: "видимая подпись пункта",
    states: selectionMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemIndicator: {
    means: "указатель выбранного пункта — галочку кладёт потребитель",
    states: {
      checked: { means: "этот пункт выбран" },
      unchecked: { means: "этот пункт не выбран" },
    },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  valueText: {
    means: "показывает выбранное значение(я) строкой через запятую, либо плейсхолдер",
    states: disabledMeans,
    accepts: [],
  },
  empty: {
    means: "показан, только пока набор пуст",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
};
