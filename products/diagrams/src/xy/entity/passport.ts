// RUNTIME passport of the xy family — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on. Editor-facing metadata lives in
// `playground/index.ts` instead.
//
// NO CONNECTOR TO READ MARKS FROM — the same situation the kit's own `table` passport is in
// (`packages/ui/src/table/entity/passport.ts`'s own file header): every mark below is read from
// OUR OWN component (`../components/index.tsx`), verified against what it actually writes, not
// reverse-engineered from a third party.
//
// ## `axis`'s `data-orientation` is a REAL, per-NODE mark — not the closed vocabulary's
// `orientation` SETTING
//
// The closed `SETTINGS` vocabulary's `orientation` is a whole-COMPONENT knob: one value for the
// entire instance (the splitter's/carousel's own `orientation` passport settings — one
// `<Splitter orientation="vertical">`, every part inside agrees). `axis` cannot use that shape: a
// single `Xy` root routinely hosts BOTH an x-axis AND a y-axis child AT ONCE, each with its own,
// independent orientation — a per-instance fact, the same category as the tree view's own
// `nodeCheckbox` three-way `data-state` (a mark the PART itself carries, not a setting on the
// whole component). Declared as two named states, `x`/`y`, mutually exclusive by construction
// (`XyAxis`'s own `orientation` prop is required, not optional).

import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
// TYPE ONLY: `import type` is erased at build time entirely. Needed only so the setting keys are
// checked against the component's real props.
import type { XyProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

/** This axis places its ticks along the horizontal — a bottom axis. */
const x: PassportState = { name: "x", mark: { kind: "attribute", name: "data-orientation", value: "x" } };
/** This axis places its ticks along the vertical — a left axis. */
const y: PassportState = { name: "y", mark: { kind: "attribute", name: "data-orientation", value: "y" } };

/** Passport of the xy family — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    // No states of its own: `Xy` is a plain sized `<svg>`, nothing on it varies with anything a
    // skin would key a rule on (see the file header — root is a wrapper, not a state owner).
    { name: "root", states: [] },
    { name: "axis", states: [x, y] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `width`/`height`/`scale`/`ticks`/`tickFormat`/
  // `offset` are all real props, but none of them is `orientation`/`multiple`/`collapsible` in
  // the CLOSED-vocabulary sense — `axis`'s own orientation is a per-node STATE (see file header),
  // not a whole-component setting.
  settings: defineSettings<XyProps>({}),
});
