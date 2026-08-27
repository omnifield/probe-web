// EDITOR-ONLY per-part taxonomy for the menu — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type MenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "the menu is showing" },
  closed: { means: "the menu is hidden" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

const optionMeans = {
  checked: { means: "this checkbox/radio item is checked" },
  unchecked: { means: "this checkbox/radio item is not checked" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

// Shared by `item`/`itemIndicator`/`itemText` — no hover/focus-visible on any of them: items are
// never individually focusable, `data-highlighted` is the one virtual "current item" fact
// (`../entity/passport.ts`'s own file header).
const itemFamilyMeans = {
  disabled: { means: "this item cannot be chosen" },
  highlighted: { means: "the current keyboard/pointer target — a virtual fact, not real DOM focus" },
} satisfies PassportPartEditorInfo<MenuPart>["states"];

export const parts: Readonly<Record<MenuPart, PassportPartEditorInfo<MenuPart>>> = {
  arrow: {
    means: "wraps `arrowTip` — positioned by the kit, no graphic of its own",
    states: {},
    accepts: [{ kind: "part", name: "arrowTip" }],
  },
  arrowTip: {
    means: "the visible triangle inside `arrow` — a skin draws its shape, typically a rotated square",
    states: {},
    accepts: [],
  },
  positioner: {
    means: "positions `content` against whichever trigger opened it — a pure wrapper, no look of its own",
    states: {},
    variables: {
      "--reference-width": { means: "measured width of the trigger the menu is positioned against" },
      "--reference-height": { means: "measured height of the trigger the menu is positioned against" },
      "--available-width": { means: "space left before the panel would hit the viewport edge" },
      "--available-height": { means: "space left before the panel would hit the viewport edge" },
    },
    accepts: [{ kind: "part", name: "content" }],
  },
  content: {
    means: "the floating panel — holds real keyboard focus for every item at once",
    states: openClosedMeans,
    accepts: [
      { kind: "part", name: "arrow" },
      { kind: "part", name: "item" },
      { kind: "part", name: "itemGroup" },
      { kind: "part", name: "separator" },
    ],
  },
  indicator: {
    means: "a small marker on `trigger` for whether the menu is open — no graphic of its own",
    states: openClosedMeans,
    accepts: [],
  },
  trigger: {
    means: "opens the menu",
    states: { ...openClosedMeans, current: { means: "this is the trigger that opened the menu (multi-trigger menus only)" }, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  triggerItem: {
    means: "a submenu's own trigger, rendered as an item of its parent menu",
    states: { ...openClosedMeans, disabled: { means: "this item (and the submenu it opens) cannot be chosen" }, highlighted: { means: "the current keyboard/pointer target" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  contextTrigger: {
    means: "wraps an element so right-click (or long-press) opens the menu at the pointer",
    states: { ...openClosedMeans, current: { means: "this is the trigger that opened the menu (multi-trigger menus only)" } },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "component" },
    ],
  },
  separator: {
    means: "a visual/semantic divider between groups of items",
    states: {},
    accepts: [],
  },
  itemGroup: {
    means: "wraps a labeled cluster of items",
    states: {},
    accepts: [
      { kind: "part", name: "itemGroupLabel" },
      { kind: "part", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "the group's own heading",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "one action — plain, or checkbox/radio-shaped (data-type tells which)",
    states: {
      ...itemFamilyMeans,
      ...optionMeans,
      radio: { means: "this is a radio-shaped item — one of a mutually exclusive set" },
      checkbox: { means: "this is a checkbox-shaped item — independently toggleable" },
    },
    accepts: [
      { kind: "part", name: "itemIndicator" },
      { kind: "part", name: "itemText" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemIndicator: {
    means: "a checkmark/dot slot inside a checkbox/radio item — hidden by the kit while unchecked",
    states: { ...itemFamilyMeans, ...optionMeans },
    accepts: [{ kind: "content", genus: "icon" }],
  },
  itemText: {
    means: "an item's own label text",
    states: { ...itemFamilyMeans, ...optionMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
