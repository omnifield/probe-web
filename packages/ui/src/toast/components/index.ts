export { Toast, type ToastProps } from "./root.js";

import {
  ToastRoot as ArkRoot,
  ToastTitle as ArkTitle,
  ToastDescription as ArkDescription,
  ToastCloseTrigger as ArkCloseTrigger,
} from "@ark-ui/solid/toast";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toast } from "./root.js";

export const kit = defineKitComponent(passport, {
  group: Toast,
  root: ArkRoot,
  title: ArkTitle,
  description: ArkDescription,
  closeTrigger: ArkCloseTrigger,
});
