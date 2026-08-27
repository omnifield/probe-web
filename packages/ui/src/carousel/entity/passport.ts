// RUNTIME passport of the carousel — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/carousel/carousel.connect.mjs` for the nine Zag-backed
// parts, and from `@ark-ui/solid`'s own `carousel-autoplay-indicator.tsx`/`carousel-progress-
// text.tsx` for the two Ark-only ones (`../entity/anatomy.ts` explains why those two exist at
// all) — the same rigor the rest of the kit's passports read from a `.connect.mjs`, applied to
// both sources this component actually has.
//
// ## `data-orientation` on nine of eleven parts — a SETTING, not a state repeated nine times
//
// Same device as the accordion's (`PWEB-104`) and the tabs' own passport: checked present on
// `root`/`itemGroup`/`item`/`control`/`nextTrigger`/`prevTrigger`/`indicatorGroup`/`indicator`/
// `autoplayTrigger` — NOT on `progressText` or `autoplayIndicator` (`getProgressTextProps`/the
// autoplay indicator's own JSX spread neither write it). Declared ONCE, as `orientation` in
// `settings` below.
//
// ## `prevTrigger`/`nextTrigger`'s disabledness is NATIVE ONLY — no data mark at all
//
// `getPrevTriggerProps`/`getNextTriggerProps` set `disabled: !canScrollPrev`/`!canScrollNext`
// as a real HTML attribute and write NOTHING else for it — no `data-disabled`, unlike the
// trigger buttons the rest of the kit has met so far (select's own `trigger`, tabs' own
// `trigger`). The honest mark here is `:disabled`, not an attribute that does not exist.
//
// ## `autoplayIndicator` is content-conditional, not look-conditional
//
// `CarouselAutoplayIndicator` always renders its own `<span>` — unlike the field's `errorText`/
// `requiredIndicator`, which are conditionally MOUNTED, this node is conditionally FILLED: a
// `<Show when={isPlaying}>` picks between `children` and the `fallback` prop, but the span
// itself, and its address, exist either way. No attribute on it varies with playing state (that
// is `autoplayTrigger`'s own `data-pressed`), so there is no state to declare — only `accepts` in
// `playground/parts.ts`.

import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are
// checked against the component's real props.
import type { CarouselProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** Passport of the carousel — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "itemGroup", states: [{ name: "dragging", mark: { kind: "attribute", name: "data-dragging" } }] },
    { name: "item", states: [{ name: "inview", mark: { kind: "attribute", name: "data-inview" } }] },
    { name: "control", states: [] },
    {
      name: "prevTrigger",
      states: [
        // Native ONLY: no `data-disabled` is ever written for either trigger button.
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "nextTrigger",
      states: [
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    { name: "indicatorGroup", states: [] },
    {
      name: "indicator",
      states: [
        { name: "current", mark: { kind: "attribute", name: "data-current" } },
        { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "autoplayTrigger",
      states: [
        { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    // No states: no data attribute of its own beyond identity (`../entity/anatomy.ts` covers
    // `data-orientation`'s absence here already).
    { name: "progressText", states: [] },
    // No states: content-conditional, not look-conditional (see file header).
    { name: "autoplayIndicator", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` (`PWEB-89`) — same name, same
  // shape, same mark as the accordion's and the tabs' own. `loop`/`slidesPerPage`/`spacing`/
  // `slidesPerMove`/`snapType`/`autoSize`/`allowMouseDrag`/`padding`/`autoplay` are all real props
  // the carousel accepts, but none of them is in the closed vocabulary — `defineSettings`'s own
  // `Extract<keyof Props, PassportSettingName>` filters them out by construction, the same result
  // the plain button's empty settings already demonstrates for its own unmatched props.
  settings: defineSettings<CarouselProps>({
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
