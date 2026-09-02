export { Surface, type SurfaceProps } from "./root.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Surface } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: Surface,
});
