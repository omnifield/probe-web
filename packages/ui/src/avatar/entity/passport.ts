// RUNTIME passport of the avatar — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/avatar/avatar.connect.mjs` (54 lines, read in full —
// the smallest connector in the kit), the same rigor the rest of the kit's passports read from a
// `.connect.mjs`.
//
// ## `root` has NO states at all — the only fact here is whether the IMAGE loaded, and that
// belongs to `image`/`fallback`, not to their shared wrapper
//
// `getRootProps` sets only `dir`/`id` — checked, no `data-*` mark of any kind. A skin cannot key a
// rule on "this avatar's image loaded" from `root` itself; it has to reach for `image` or
// `fallback` directly, and that is what the connector actually gives it, not a gap.
//
// ## `image`/`fallback` share ONE fact with OPPOSITE polarity, not two independent ones
//
// Both carry `data-state` (`"visible"`/`"hidden"`), and both derive it from the SAME boolean
// (`state.matches("loaded")`) — `image` is `"visible"` exactly when `fallback` is `"hidden"`, and
// vice versa, always. Declared as the same two named states on both parts (the same device the
// dialog's own `open`/`closed` uses across `trigger`/`backdrop`/`content`), not reinvented per
// part: `visible`/`hidden` mean the same thing everywhere they appear in this kit — "this node is
// the one currently showing" — even though which part is showing flips with the same signal.
// Native `hidden` (present on whichever one is not showing) is not declared separately: the same
// fact `data-state` already carries, the checkbox's own indicator's own exclusion.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { AvatarProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** This node is the one currently showing. */
const visible = {
  name: "visible",
  mark: { kind: "attribute", name: "data-state", value: "visible" },
} as const satisfies PassportState;

/** The other node — always exactly one of the two is `visible`, the other `hidden`. */
const hidden = {
  name: "hidden",
  mark: { kind: "attribute", name: "data-state", value: "hidden" },
} as const satisfies PassportState;

const visibleHidden: readonly PassportState[] = [visible, hidden];

/** Passport of the avatar — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "image", states: visibleHidden },
    { name: "fallback", states: visibleHidden },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: the avatar has no `orientation`/`multiple`/
  // `collapsible` prop — the same empty result the plain button's and the dialog's own settings
  // already show.
  settings: defineSettings<AvatarProps>()({}),
});
