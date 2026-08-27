// MAP of the toggle group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { ToggleGroup, ToggleGroupItem } from "./index.jsx";

/** The toggle group's passport together with whatever draws each of its two parts. */
export const kit = defineKitComponent(passport, {
  root: ToggleGroup,
  item: ToggleGroupItem,
});
