export { Toast, type ToastProps } from "./root.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toast } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: Toast,
});
