// MAP of the radio group: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  RadioGroup,
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
  RadioGroupLabel,
} from "./index.jsx";

/**
 * The radio group's passport together with whatever draws each of its six parts.
 *
 * `itemHiddenInput` sits outside `parts` — it has no part in the passport (`../entity/
 * anatomy.ts`), and `parts`' keys are checked against the anatomy's parts, not against every node
 * the components render. It lives in `extras` instead (`PWEB-152`): a real, addressable-by-name-
 * only-not-by-anatomy component an assembly tree can still place — without it, a preview built
 * from an assembly renders the right look but a click never changes the chosen value: the real
 * `onChange` that drives `SET_VALUE` lives on this exact node, not on the label (`item`).
 */
export const kit = defineKitComponent(
  passport,
  {
    root: RadioGroup,
    label: RadioGroupLabel,
    item: RadioGroupItem,
    itemText: RadioGroupItemText,
    itemControl: RadioGroupItemControl,
    indicator: RadioGroupIndicator,
  },
  { hiddenInput: RadioGroupItemHiddenInput },
);
