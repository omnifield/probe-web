// MAP of the drawer: passport part → the component that draws it (`PWEB-84`).
//
// `Drawer` (the root) is not here: it carries no anatomy part at all (`../entity/anatomy.ts`),
// and the map's keys are checked against anatomy parts, not against every rendered component.
// `DrawerStack`/`DrawerIndent`/`DrawerIndentBackground` are absent for the same structural
// reason, named in full in `../entity/anatomy.ts`: they draw from a separate stacking API, no
// anatomy part of their own to map.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  DrawerBackdrop,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerDescription,
  DrawerGrabber,
  DrawerGrabberIndicator,
  DrawerPositioner,
  DrawerSwipeArea,
  DrawerTitle,
  DrawerTrigger,
} from "./index.jsx";

/** The drawer's passport together with whatever draws each of its ten parts. */
export const kit = defineKitComponent(passport, {
  positioner: DrawerPositioner,
  content: DrawerContent,
  title: DrawerTitle,
  description: DrawerDescription,
  trigger: DrawerTrigger,
  backdrop: DrawerBackdrop,
  grabber: DrawerGrabber,
  grabberIndicator: DrawerGrabberIndicator,
  closeTrigger: DrawerCloseTrigger,
  swipeArea: DrawerSwipeArea,
});
