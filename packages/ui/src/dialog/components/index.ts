export { Dialog, type DialogProps } from "./root.js";
export { DialogControl, type DialogControlProps } from "./control.js";
export { DialogContent, type DialogContentProps } from "./content/index.js";

import {
  DialogBackdrop as ArkBackdrop,
  DialogCloseTrigger as ArkCloseTrigger,
} from "@ark-ui/solid/dialog";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Dialog } from "./root.js";
import { DialogControl } from "./control.js";
import { DialogContent } from "./content/index.js";

export const kit = defineKitComponent(
  passport,
  {
    control: DialogControl,
    backdrop: ArkBackdrop,
    content: DialogContent,
    closeTrigger: ArkCloseTrigger,
  },
  Dialog,
);
