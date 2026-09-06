export { Icon, type IconProps } from "./root.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Icon } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: Icon,
});
