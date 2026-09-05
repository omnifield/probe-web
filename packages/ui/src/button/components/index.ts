export { Button, type ButtonProps } from "./root.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Button } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: Button,
});
