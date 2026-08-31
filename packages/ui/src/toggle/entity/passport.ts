// RUNTIME passport of the toggle — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/toggle/toggle.connect.mjs` (42 lines, read in full —
// tied with avatar's for the smallest connector in the kit), the same rigor the rest of the kit's
// passports read from a `.connect.mjs`.
//
// ## `root` carries the SAME on/off fact THREE different ways at once — native `aria-pressed`,
// native `disabled`, AND two separate `data-*` marks — every one of them declared, none dropped
//
// `getRootProps` sets `"aria-pressed": pressed` (native, for assistive tech), `"data-state"`
// (`"on"`/`"off"`, a two-valued attribute), `"data-pressed"` (a THIRD, presence-only encoding of
// the exact same boolean), and separately `disabled`(native)/`"data-disabled"`. Declared as FOUR
// named states below (`on`/`off`/`pressed`/`disabled`), not collapsed to two: a skin might key off
// `data-state`'s two-valued shape OR `data-pressed`'s presence-only shape, and this connector
// genuinely offers both, unreconciled — the same "declare every mark actually written, even when
// two marks encode one fact" rule the avatar's own `visible`/`hidden` follows, except here it is
// the SAME part carrying both encodings of the SAME fact, not two different parts.
//
// ## `indicator` carries the identical four marks, independently — not inherited from `root`
//
// `getIndicatorProps` repeats `data-disabled`/`data-pressed`/`data-state` verbatim (checked
// side-by-side with `getRootProps`) — no `aria-pressed` there (only the interactive `root` needs
// it), otherwise the same shape. Declared on `indicator` too, not left to "cascades visually from
// root" — a skin styling the glyph directly needs its own address for the same fact, the mark is
// real on that node, not assumed.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { ToggleProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Two-valued encoding of pressed/unpressed — `data-state`. */
const on = { name: "on", mark: { kind: "attribute", name: "data-state", value: "on" } } as const satisfies PassportState;
const off = { name: "off", mark: { kind: "attribute", name: "data-state", value: "off" } } as const satisfies PassportState;

/** Presence-only encoding of the SAME fact — `data-pressed`, absent when unpressed. */
const pressed = { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } } as const satisfies PassportState;

/** This node cannot be interacted with. */
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

const sharedStates: readonly PassportState[] = [on, off, pressed, disabled];

/** Passport of the toggle — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: sharedStates },
    { name: "indicator", states: sharedStates },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `pressed`/`defaultPressed`/`onPressedChange`/
  // `disabled` are all real props, but none is `orientation`/`multiple`/`collapsible` — the same
  // empty result the avatar's/dialog's own settings already show.
  settings: defineSettings<ToggleProps>()({}),
});
