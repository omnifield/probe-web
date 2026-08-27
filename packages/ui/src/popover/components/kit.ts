// MAP of the popover: passport part → the component that draws it (`PWEB-84`).
//
// `Popover` (the root) is not in `parts`: it carries no anatomy part at all (`../entity/
// anatomy.ts`), and `parts`' keys are checked against anatomy parts, not against every rendered
// component. It is the passport's `provider` instead (`PWEB-153`): the invisible context that
// `positioner` (the passport's chosen stand-in root) needs to read — without it, mounting
// `positioner` on its own throws, since Ark's own context is never established.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Popover,
  PopoverAnchor,
  PopoverTrigger,
  PopoverIndicator,
  PopoverPositioner,
  PopoverArrow,
  PopoverArrowTip,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
  PopoverCloseTrigger,
} from "./index.jsx";

/** The popover's passport together with whatever draws each of its ten parts. */
export const kit = defineKitComponent(
  passport,
  {
    arrow: PopoverArrow,
    arrowTip: PopoverArrowTip,
    anchor: PopoverAnchor,
    trigger: PopoverTrigger,
    indicator: PopoverIndicator,
    positioner: PopoverPositioner,
    content: PopoverContent,
    title: PopoverTitle,
    description: PopoverDescription,
    closeTrigger: PopoverCloseTrigger,
  },
  undefined,
  Popover,
);
