// RUNTIME passport of the slider — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/slider/slider.connect.mjs` (334 lines) and
// `slider.style.mjs` (its own inline-style module, also read in full), the same rigor the rest of
// the kit's passports read from a `.connect.mjs`.
//
// ## `orientation` IS a setting here — unlike the date picker's `view` or the drawer's `swipeDirection`
//
// `data-orientation` reaches all TEN parts (checked on every `getXxxProps`) — the same "one mark,
// checked everywhere" bar the tabs' own `orientation` already clears. Unlike those two other
// components, the PROP NAME here is literally `"orientation"` — one of the closed vocabulary's
// three names — so `defineSettings` accepts it directly, the tabs'/accordion's own shape, not a
// forced state the way `view`/`swipeDirection` had to be.
//
// ## `dragging`/`focus` are GROUP-LEVEL on most parts, but PER-THUMB on `thumb` itself
//
// `root`/`label`/`track`/`range`/`control` all mirror the SAME `state.matches("dragging")`/
// `state.matches("focus")` — true when ANY thumb is being dragged or focused.
// `getThumbProps` computes NARROWER versions instead: `dataAttr(dragging && focusedIndex ===
// index)`/`dataAttr(focused && focusedIndex === index)` — true only for the ONE thumb actually
// being dragged/focused. Same state NAMES, same marks, declared once and shared — the CONDITION
// differs by part, not the address a skin author writes rules against.
//
// ## `thumb` is a genuine, focusable node — `:hover`/`:active` are real, `data-focus` is not redundant with `:focus-visible`
//
// `thumb` gets real `tabIndex`/`onFocus`/`onBlur`, and NOTHING intercepts pointer-hover (no
// `onPointerMove`/`onPointerLeave` the way the checkbox's own root has) — so `:hover`/`:active`
// are genuine, undeclared-elsewhere pseudo-classes, the plain button's own reasoning. `data-focus`
// is still declared over `:focus-visible`, though, because it is the mark EXPLICITLY emitted (the
// tabs' trigger's own rule) — and because it answers a narrower question `:focus-visible` cannot:
// "is THIS thumb the focused one," not just "is this node focused."
//
// ## `marker`'s `data-state` is a real three-way fact about POSITION, not interaction
//
// `getMarkerProps` computes `"under-value"`/`"at-value"`/`"over-value"` by comparing the marker's
// own `value` against the slider's current value(s) — a marker keeps its own honest position-
// relative-to-value fact regardless of whether the slider is being dragged.
//
// ## `root`'s custom properties: five fixed names declared, one family of DYNAMIC ones is not
//
// `getRootStyle` (`slider.style.mjs`) writes `--slider-thumb-width`/`--slider-thumb-height`/
// `--slider-thumb-transform`/`--slider-range-start`/`--slider-range-end` — fixed names, declared
// below. It ALSO writes `--slider-thumb-offset-${index}`, ONE PER THUMB — a family of dynamically-
// named properties the `PassportVariable` model (one declaration, one fixed name) cannot express
// at all. Left undeclared, named here as a real model limitation, not silently worked around or
// hidden. `marker`'s own `--translate-x`/`--translate-y` are written AND read on `marker` itself
// (not on `root`), the same "self-consuming" shape the date picker's own `content` variables have.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { SliderProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** The slider (or, on `thumb`, this one thumb) is disabled. */
const disabled: PassportState = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } };
/** The enclosing form rejected the value. */
const invalid: PassportState = { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } };
/** A drag is in progress — group-level on most parts, narrowed to "this thumb" on `thumb` itself. */
const dragging: PassportState = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } };
/** A thumb has focus — group-level on most parts, narrowed to "this thumb" on `thumb` itself. */
const focus: PassportState = { name: "focus", mark: { kind: "attribute", name: "data-focus" } };

/** Shared by `root`/`label`/`track`/`range`/`control` — every group-level fact each of them carries. */
const groupStates: readonly PassportState[] = [disabled, invalid, dragging, focus];

const hoverPseudo: PassportState = { name: "hover", mark: { kind: "pseudo", name: ":hover" } };
const activePseudo: PassportState = { name: "active", mark: { kind: "pseudo", name: ":active" } };

/** Passport of the slider — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: groupStates,
      variables: [
        { name: "--slider-thumb-width", setBy: "kit" },
        { name: "--slider-thumb-height", setBy: "kit" },
        { name: "--slider-thumb-transform", setBy: "kit" },
        { name: "--slider-range-start", setBy: "kit" },
        { name: "--slider-range-end", setBy: "kit" },
      ],
    },
    { name: "label", states: groupStates },
    { name: "valueText", states: [disabled, invalid, focus] },
    { name: "track", states: groupStates },
    { name: "range", states: groupStates },
    { name: "control", states: groupStates },
    {
      name: "thumb",
      states: [disabled, focus, dragging, hoverPseudo, activePseudo],
    },
    { name: "markerGroup", states: [] },
    {
      name: "marker",
      states: [
        disabled,
        { name: "under-value", mark: { kind: "attribute", name: "data-state", value: "under-value" } },
        { name: "at-value", mark: { kind: "attribute", name: "data-state", value: "at-value" } },
        { name: "over-value", mark: { kind: "attribute", name: "data-state", value: "over-value" } },
      ],
      variables: [
        { name: "--translate-x", setBy: "kit" },
        { name: "--translate-y", setBy: "kit" },
      ],
    },
    {
      name: "draggingIndicator",
      states: [
        { name: "open", mark: { kind: "attribute", name: "data-state", value: "open" } },
        { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` — see the file header. Real
  // mark, checked present on all ten parts, default `"horizontal"` (`slider.machine.mjs`'s own
  // `props()` default, checked live). `disabled`/`invalid` are excluded the same way the checkbox
  // excludes them: already declared as STATES above.
  settings: defineSettings<SliderProps>({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
