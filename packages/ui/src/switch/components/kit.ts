// MAP of the switch: passport part → the component that draws it (`PWEB-84`).
//
// `hiddenInput` is not in `parts`: it carries no part in the anatomy (`../entity/anatomy.ts`), and
// `parts`' keys are checked against anatomy parts, not against the full set of rendered nodes. It
// lives in `extras` instead (`PWEB-152`): a real, addressable-by-name-only component an assembly
// tree can still place — without it a preview looks right but a click never toggles the switch.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Switch, SwitchControl, SwitchHiddenInput, SwitchThumb, SwitchLabel } from "./index.jsx";

/** The switch's passport together with whatever draws each of its four parts. */
export const kit = defineKitComponent(
  passport,
  {
    root: Switch,
    control: SwitchControl,
    thumb: SwitchThumb,
    label: SwitchLabel,
  },
  { hiddenInput: SwitchHiddenInput },
);
