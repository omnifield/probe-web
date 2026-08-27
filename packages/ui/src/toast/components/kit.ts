// MAP of the toast: passport part → the component that draws it (`PWEB-84`).
//
// `root` maps to `ToastRoot` (one toast's own wrapper), NOT to `Toaster` — `Toaster` draws
// `group` (`../entity/anatomy.ts` explains the two-machine split); `createToaster` is a factory
// function, not a component, and has no entry here.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toaster, ToastActionTrigger, ToastCloseTrigger, ToastDescription, ToastRoot, ToastTitle } from "./index.jsx";

/** The toast's passport together with whatever draws each of its six parts. */
export const kit = defineKitComponent(passport, {
  group: Toaster,
  root: ToastRoot,
  title: ToastTitle,
  description: ToastDescription,
  actionTrigger: ToastActionTrigger,
  closeTrigger: ToastCloseTrigger,
});
