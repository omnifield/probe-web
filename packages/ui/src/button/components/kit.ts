// MAP of the button: passport part → the component that draws it (`PWEB-84`).
//
// One part, and the map looks redundant right up until the button gets a second one: it is
// added HERE then, not by twenty consumers separately.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Button } from "./index.jsx";

/** The button's passport together with whatever draws its single part. */
export const kit = defineKitComponent(passport, {
  root: Button,
});
