import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
import type { DrawerProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const open = { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } } as const satisfies PassportState;
const closed = { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } } as const satisfies PassportState;
const openClosed: readonly PassportState[] = [open, closed];

const swipeUp = { name: "up", mark: { kind: "attribute", name: "data-swipe-direction", value: "up" } } as const satisfies PassportState;
const swipeDown = { name: "down", mark: { kind: "attribute", name: "data-swipe-direction", value: "down" } } as const satisfies PassportState;
const swipeLeft = { name: "left", mark: { kind: "attribute", name: "data-swipe-direction", value: "left" } } as const satisfies PassportState;
const swipeRight = { name: "right", mark: { kind: "attribute", name: "data-swipe-direction", value: "right" } } as const satisfies PassportState;
const swipeDirectionStates: readonly PassportState[] = [swipeUp, swipeDown, swipeLeft, swipeRight];

const swiping = { name: "swiping", mark: { kind: "attribute", name: "data-swiping" } } as const satisfies PassportState;
const dragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;

const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

export const passport = definePassport({
  anatomy,
  root: "positioner",
  parts: [
    { name: "positioner", states: [...openClosed, ...swipeDirectionStates] },
    {
      name: "content",
      states: [
        ...openClosed,
        ...swipeDirectionStates,
        swiping,
        dragging,
        { name: "expanded", mark: { kind: "attribute", name: "data-expanded" } },
        { name: "nested-drawer-open", mark: { kind: "attribute", name: "data-nested-drawer-open" } },
        { name: "nested-drawer-swiping", mark: { kind: "attribute", name: "data-nested-drawer-swiping" } },
      ],
      variables: [
        { name: "--drawer-translate", setBy: "kit" },
        { name: "--drawer-translate-x", setBy: "kit" },
        { name: "--drawer-translate-y", setBy: "kit" },
        { name: "--drawer-snap-point-offset-x", setBy: "kit" },
        { name: "--drawer-snap-point-offset-y", setBy: "kit" },
        { name: "--drawer-swipe-movement-x", setBy: "kit" },
        { name: "--drawer-swipe-movement-y", setBy: "kit" },
        { name: "--drawer-swipe-strength", setBy: "kit" },
        { name: "--nested-drawers", setBy: "kit" },
        { name: "--drawer-height", setBy: "kit" },
        { name: "--drawer-frontmost-height", setBy: "kit" },
      ],
    },
    { name: "title", states: [] },
    { name: "description", states: [] },
    {
      name: "trigger",
      states: [
        ...openClosed,
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        ...buttonPseudos,
      ],
    },
    {
      name: "backdrop",
      states: [...openClosed, swiping],
      variables: [
        { name: "--drawer-swipe-progress", setBy: "kit" },
        { name: "--drawer-swipe-strength", setBy: "kit" },
      ],
    },
    {
      name: "grabber",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "grabberIndicator", states: [] },
    { name: "closeTrigger", states: buttonPseudos },
    {
      name: "swipeArea",
      states: [
        ...openClosed,
        ...swipeDirectionStates,
        swiping,
        { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<DrawerProps>()({}),
});
