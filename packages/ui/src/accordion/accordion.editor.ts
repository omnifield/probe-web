// EDITOR-ONLY metadata for the accordion (`PWEB-115`, `PWEB-118`, decomposed `PWEB-124`).
//
// Human-facing text, taxonomy, and nesting rules for the visual editor and for agents reading the
// catalog — never for the running app. See `button.editor.ts` for the full argument (Storybook
// `argTypes`/docs vs. component code, Zag/Ark's own `anatomy.ts`); the short version:
// `defineEditorInfo` depends one-way on `passport` (the runtime contract in `accordion.anatomy.ts`),
// and nothing flows back, so a production bundle that never imports `/editor` never pays for a
// single word written below.
//
// Structural assembly TEMPLATES — worked tree examples, a different concern from the taxonomy
// declared here — live in `accordion.assemblies.ts`, imported below.
//
// Nesting is declared TWO levels deep: the item inside the root, the trigger and the content
// inside the item. This is the first place where the nesting rule is checkable at all — the
// button has no internal parts, and there was nothing to derive "who can be an ancestor" from.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { assemblies } from "./accordion.assemblies.js";
import { passport } from "./accordion.anatomy.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  // The provider is US, not Ark: the component ships outward as our own delivery, and a passport
  // reader records exactly that. A test guards the match against the manifest.
  package: "@omnifield/probe-web-ui",
  genus: "component",
  // Place in the catalog (`PWEB-34`): something that expands and collapses.
  group: "disclosure",
  variantAxis: {
    means: "the variant name a human gives the accordion in the editor; the kit passes it through untouched",
  },
  parts: {
    root: {
      means: "the whole set of items — one node wrapping every item",
      accepts: [{ kind: "part", name: "item" }],
    },
    item: {
      means: "one item — a trigger together with its content",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      accepts: [
        { kind: "part", name: "itemTrigger" },
        { kind: "part", name: "itemContent" },
      ],
    },
    itemTrigger: {
      means: "the item's button — expands and collapses it",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        focus: { means: "focus is on this item's trigger" },
        disabled: { means: "the button is disabled — clicking it does not expand the item" },
        hover: { means: "pointer is over the button" },
        "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
        active: { means: "the button is being held down" },
      },
      accepts: [
        { kind: "part", name: "itemIndicator" },
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
    itemContent: {
      means: "the item's content — the area that gets expanded",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        closed: { means: "the item is collapsed — its content is hidden, but the node stays in place" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      variables: {
        "--height": { means: "the measured height of the expanded content" },
        "--width": { means: "the measured width of the expanded content — needed by a horizontal accordion" },
      },
      // Anything goes inside an item's content — this is the consumer's spot, not ours: text, an
      // icon, any component. An empty list here would mean there is nothing to expand.
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
    },
    itemIndicator: {
      means: "the expansion indicator — an arrow placed by the consumer",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
  },
  settings: {
    orientation: {
      means: "how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria",
      options: {
        vertical: { means: "top to bottom" },
        horizontal: { means: "left to right" },
      },
    },
    multiple: { means: "whether several items can stay expanded at once" },
    collapsible: { means: "whether the last expanded item can be closed, leaving the whole accordion collapsed" },
  },
  // Structural assembly templates — moved out to `accordion.assemblies.ts` (`PWEB-124`): worked
  // tree examples are a different concern from the taxonomy/meaning declared above, and mixing
  // them here was exactly what made this file read as one thousand-line wall with no boundary.
  assemblies,
});
