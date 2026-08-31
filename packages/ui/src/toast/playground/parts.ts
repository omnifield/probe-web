// EDITOR-ONLY per-part taxonomy for the toast — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as every other component's `playground/parts.ts` (`PWEB-127`): one file,
// exhaustive over the anatomy, `accepts`/state KEYS true to the real Ark composition read while
// building `../entity/`.
//
// Every part key, every state key (matches `../entity/passport.ts` exactly — `defineEditorInfo`
// throws otherwise), and every `accepts` rule (mirrors the doc-comment example in
// `../components/index.tsx`: `group` wraps one `root` per live toast, `root` wraps `title` +
// `description` + `actionTrigger` + `closeTrigger`) is real.

import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY — see `assemblies.ts` for why: `typeof passport` needs the binding's TYPE, not the
// module's side effects.
import type { passport } from "../entity/passport.js";

type ToastPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const positionMeans = {
  "top-start": { means: "positioned at the top, start side" },
  top: { means: "positioned at the top, centered" },
  "top-end": { means: "positioned at the top, end side" },
  "bottom-start": { means: "positioned at the bottom, start side" },
  bottom: { means: "positioned at the bottom, centered" },
  "bottom-end": { means: "positioned at the bottom, end side" },
  "side-top": { means: "on the top half of the viewport — the vertical half of `placement`, addressable on its own" },
  "side-bottom": { means: "on the bottom half of the viewport — the vertical half of `placement`, addressable on its own" },
  "align-start": { means: "aligned to the start edge — the horizontal half of `placement`, addressable on its own" },
  "align-center": { means: "centered — the horizontal half of `placement`, addressable on its own" },
  "align-end": { means: "aligned to the end edge — the horizontal half of `placement`, addressable on its own" },
} satisfies PassportPartEditorInfo<ToastPart>["states"];

const buttonPseudoMeans = {
  hover: { means: "pointer is over this button" },
  "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
  active: { means: "this button is being held down" },
} satisfies PassportPartEditorInfo<ToastPart>["states"];

export const parts: Readonly<Record<ToastPart, PassportPartEditorInfo<ToastPart>>> = {
  group: {
    means: "the toast region for one placement corner — wraps every live toast anchored there",
    states: positionMeans,
    accepts: [{ kind: "component", name: "root" }],
  },
  root: {
    means: "one live toast's own wrapper",
    states: {
      ...positionMeans,
      open: { means: "the toast is showing" },
      closed: { means: "the toast is dismissed or has not yet appeared" },
      success: { means: "a success-type toast" },
      error: { means: "an error-type toast" },
      loading: { means: "a loading-type toast" },
      info: { means: "an info-type toast" },
      warning: { means: "a warning-type toast" },
      mounted: { means: "the toast has mounted into the DOM" },
      paused: { means: "the toast's auto-dismiss timer is paused (e.g. the pointer is over it)" },
      first: { means: "this is the frontmost toast in its group" },
      sibling: { means: "this toast is NOT the frontmost one — a sibling behind it" },
      stack: { means: "toasts in this group are stacked (not overlapping)" },
      overlap: { means: "toasts in this group are overlapping rather than stacked" },
    },
    accepts: [
      { kind: "component", name: "title" },
      { kind: "component", name: "description" },
      { kind: "component", name: "actionTrigger" },
      { kind: "component", name: "closeTrigger" },
    ],
  },
  title: {
    means: "this toast's own title",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  description: {
    means: "this toast's own description",
    states: {},
    accepts: [{ kind: "content", genus: "text" }],
  },
  actionTrigger: {
    means: "this toast's optional action button (e.g. \"Undo\") — clicking it also dismisses the toast",
    states: buttonPseudoMeans,
    accepts: [{ kind: "content", genus: "text" }],
  },
  closeTrigger: {
    means: "dismisses this toast",
    states: buttonPseudoMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
