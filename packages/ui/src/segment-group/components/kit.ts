// MAP of the segment group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemHiddenInput,
  SegmentGroupItemText,
  SegmentGroupLabel,
} from "./index.jsx";

/**
 * The segment group's passport together with whatever draws each of its six parts.
 *
 * `itemHiddenInput` sits outside `parts` — it has no part in the passport (`../entity/
 * anatomy.ts`), and `parts`' keys are checked against the anatomy's parts, not against every node
 * the components render. It lives in `extras` instead (`PWEB-152`): a real, addressable-by-name-
 * only-not-by-anatomy component an assembly tree can still place — without it a preview looks
 * right but a click never changes the chosen value.
 */
export const kit = defineKitComponent(
  passport,
  {
    root: SegmentGroup,
    label: SegmentGroupLabel,
    item: SegmentGroupItem,
    itemText: SegmentGroupItemText,
    itemControl: SegmentGroupItemControl,
    indicator: SegmentGroupIndicator,
  },
  { hiddenInput: SegmentGroupItemHiddenInput },
);
