// MAP of the xy family: passport part → the component that draws it (`PWEB-84`'s own device,
// `defineKitComponent` reused from `@omnifield/probe-web-ui` — see `../../../scripts/generate.mjs`
// header for why there is no local `kit-form.ts`).

import { defineKitComponent } from "@omnifield/probe-web-ui";
import { passport } from "../entity/passport.js";
import { Xy, XyAxis } from "./index.jsx";

/** The xy family's passport together with whatever draws each of its two parts so far. */
export const kit = defineKitComponent(passport, {
  root: Xy,
  axis: XyAxis,
});
