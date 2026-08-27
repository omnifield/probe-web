// MAP of the toggle: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toggle, ToggleIndicator } from "./index.jsx";

/** The toggle's passport together with whatever draws each of its two parts. */
export const kit = defineKitComponent(passport, {
  root: Toggle,
  indicator: ToggleIndicator,
});
