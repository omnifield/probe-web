// EDITOR-ONLY per-part taxonomy for the accordion — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-115`/`PWEB-118`, decomposed `PWEB-124`). Means, states, variables, and nesting
// (`accepts`) by part name — the taxonomy half of the editor slice; scenario data
// (`assemblies.ts`) and setting prose (`settings.ts`) are the other two, split out the same way
// and for the same reason: three different questions ("what does this part mean", "what is a
// working instance", "what do the settings mean") stopped fitting one file without a boundary.
//
// Nesting is declared TWO levels deep here: the item inside the root, the trigger and the
// content inside the item. This is the first place where the nesting rule is checkable at all —
// the button has no internal parts, and there was nothing to derive "who can be an ancestor" from.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

// The literal part-name union, read off the passport itself — see `assemblies.ts` for the same
// device and the same reason (no contextual typing reaches into a separate module).
type AccordionPart =
  typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<
  Record<AccordionPart, PassportPartEditorInfo<AccordionPart>>
> = {
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
      disabled: {
        means: "the button is disabled — clicking it does not expand the item",
      },
      hover: { means: "pointer is over the button" },
      "focus-visible": {
        means:
          "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise",
      },
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
      closed: {
        means:
          "the item is collapsed — its content is hidden, but the node stays in place",
      },
      disabled: { means: "the item is disabled — it cannot be expanded" },
      focus: { means: "focus is on this item's trigger" },
    },
    variables: {
      "--height": { means: "the measured height of the expanded content" },
      "--width": {
        means:
          "the measured width of the expanded content — needed by a horizontal accordion",
      },
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
};
