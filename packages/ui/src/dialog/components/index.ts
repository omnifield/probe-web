export { Dialog, type DialogProps } from "./root.js";
export { DialogTrigger, type DialogTriggerProps } from "./trigger.js";
export { DialogBackdrop, type DialogBackdropProps } from "./backdrop.js";
export { DialogPositioner, type DialogPositionerProps } from "./positioner.js";
export { DialogContent, type DialogContentProps } from "./content/index.js";
export { DialogTitle, type DialogTitleProps } from "./content/title.js";
export { DialogDescription, type DialogDescriptionProps } from "./content/description.js";
export { DialogCloseTrigger, type DialogCloseTriggerProps } from "./content/close-trigger.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { DialogTrigger } from "./trigger.js";
import { DialogBackdrop } from "./backdrop.js";
import { DialogPositioner } from "./positioner.js";
import { DialogContent } from "./content/index.js";
import { DialogTitle } from "./content/title.js";
import { DialogDescription } from "./content/description.js";
import { DialogCloseTrigger } from "./content/close-trigger.js";

export const kit = defineKitComponent(passport, {
  trigger: DialogTrigger,
  backdrop: DialogBackdrop,
  positioner: DialogPositioner,
  content: DialogContent,
  title: DialogTitle,
  description: DialogDescription,
  closeTrigger: DialogCloseTrigger,
});
