// EDITOR-ONLY per-part taxonomy for the dialog — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the actual Solid nesting: `positioner`
// wraps `content`, which wraps `title`/`description`/`closeTrigger` — `trigger`/`backdrop` are
// real DOM siblings of `positioner`, not ancestors or descendants, so neither appears in ANY
// part's `accepts`, the same limitation the popover's own template names) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type DialogPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const openClosedMeans = {
  open: { means: "the dialog is open" },
  closed: { means: "the dialog is closed" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<DialogPart>["states"];

export const parts: Readonly<Record<DialogPart, PassportPartEditorInfo<DialogPart>>> = {
  trigger: {
    means: "opens the dialog",
    states: {
      ...openClosedMeans,
      current: { means: "in a multi-trigger dialog, this is the trigger that opened it" },
      ...buttonPseudoMeans,
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  backdrop: {
    means: "the dimmed overlay behind the dialog",
    states: openClosedMeans,
    accepts: [],
  },
  positioner: {
    means: "centers the dialog's content in the viewport — a pure wrapper, no look of its own",
    states: {},
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "the dialog's own panel",
    states: openClosedMeans,
    accepts: [
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "closeTrigger" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  title: {
    means: "the dialog's own title",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "the dialog's own description",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "closes the dialog",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
