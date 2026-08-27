// MAP of the timer: passport part → the component that draws it (`PWEB-84`).
//
// `itemLabel`/`itemValue` map to HAND-AUTHORED components, not Ark-provided ones — `@ark-ui/solid`
// ships no Solid wrapper for either (`../entity/anatomy.ts` explains the gap).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Timer,
  TimerActionTrigger,
  TimerArea,
  TimerControl,
  TimerItem,
  TimerItemLabel,
  TimerItemValue,
  TimerSeparator,
} from "./index.jsx";

/** The timer's passport together with whatever draws each of its eight parts. */
export const kit = defineKitComponent(passport, {
  root: Timer,
  area: TimerArea,
  control: TimerControl,
  item: TimerItem,
  itemLabel: TimerItemLabel,
  itemValue: TimerItemValue,
  actionTrigger: TimerActionTrigger,
  separator: TimerSeparator,
});
