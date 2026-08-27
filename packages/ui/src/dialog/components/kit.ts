// MAP of the dialog: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  DialogBackdrop,
  DialogCloseTrigger,
  DialogContent,
  DialogDescription,
  DialogPositioner,
  DialogTitle,
  DialogTrigger,
} from "./index.jsx";

/**
 * The dialog's passport together with whatever draws each of its seven parts.
 *
 * `root` is not a key here — the passport's `root` names `positioner` (`../entity/passport.ts`),
 * and `Dialog` itself renders no node to map: it is context only, drawn by nothing.
 */
export const kit = defineKitComponent(passport, {
  trigger: DialogTrigger,
  backdrop: DialogBackdrop,
  positioner: DialogPositioner,
  content: DialogContent,
  title: DialogTitle,
  description: DialogDescription,
  closeTrigger: DialogCloseTrigger,
});
