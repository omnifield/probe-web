export { Switch, type SwitchProps } from "./root.js";
export { SwitchControl, type SwitchControlProps } from "./control.js";
export { SwitchThumb, type SwitchThumbProps } from "./thumb.js";
export { SwitchLabel, type SwitchLabelProps } from "./label.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Switch } from "./root.js";
import { SwitchControl } from "./control.js";
import { SwitchThumb } from "./thumb.js";
import { SwitchLabel } from "./label.js";

export const kit = defineKitComponent(passport, {
  root: Switch,
  control: SwitchControl,
  thumb: SwitchThumb,
  label: SwitchLabel,
});
