// EDITOR-ONLY per-part taxonomy for the segment group — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`) —
// identical `accepts` shape to the radio group's own (`PWEB-134`, same underlying machine).

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type SegmentGroupPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const groupStateMeans = {
  disabled: { means: "the whole group is disabled — no item can be chosen" },
  invalid: { means: "the enclosing form rejected the value" },
  required: { means: "the form will demand a choice on submit" },
} satisfies PassportPartEditorInfo<SegmentGroupPart>["states"];

const itemStateMeans = {
  checked: { means: "this is the chosen item" },
  unchecked: { means: "not the chosen item" },
  disabled: { means: "this item cannot be chosen — its own flag, or the whole group's" },
  readonly: { means: "the value is visible but nothing can be chosen" },
  invalid: { means: "the enclosing form rejected the value" },
  hover: { means: "pointer is over this item" },
  focus: { means: "keyboard or pointer focus is on this item's hidden input — mirrored here since the input itself is invisible" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
} satisfies PassportPartEditorInfo<SegmentGroupPart>["states"];

export const parts: Readonly<Record<SegmentGroupPart, PassportPartEditorInfo<SegmentGroupPart>>> = {
  root: {
    means: "the whole segmented control — the track and every choice in it",
    states: groupStateMeans,
    accepts: [
      { kind: "part", name: "label" },
      { kind: "part", name: "item" },
      { kind: "part", name: "indicator" },
    ],
  },
  label: {
    means: "the set's own label — describes the whole group, not any one choice",
    states: groupStateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "one segment — a clickable slot; click anywhere on it to select",
    states: itemStateMeans,
    accepts: [
      { kind: "part", name: "itemControl" },
      { kind: "part", name: "itemText" },
      // The real hidden `<input type="radio">` (`PWEB-152`) — no address of its own, but the
      // node the real `onChange` lives on; without it a preview looks right and never selects.
      { kind: "extra", name: "hiddenInput" },
    ],
  },
  itemText: {
    means: "this segment's own label text",
    states: itemStateMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemControl: {
    means: "this segment's own visible surface — what the sliding indicator sizes itself against",
    states: { ...itemStateMeans, active: { means: "this segment is being pressed" } },
    // Occupied — a plain surface, no consumer content in Ark's own documented usage.
    accepts: [],
  },
  indicator: {
    means: "the single sliding pill — sits behind whichever segment is currently chosen",
    states: { disabled: { means: "the whole group is disabled" } },
    variables: {
      "--left": { means: "measured horizontal position of the chosen segment" },
      "--top": { means: "measured vertical position of the chosen segment" },
      "--width": { means: "measured width of the chosen segment" },
      "--height": { means: "measured height of the chosen segment" },
    },
    accepts: [],
  },
};
