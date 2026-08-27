// MAP of the select: passport part → the component that draws it (`PWEB-84`).
//
// Fifteen parts, the largest map in the kit — and it is exactly where the map earns its keep the
// most: a consumer guessing how `itemGroupLabel` turns into `SelectItemGroupLabel` would be
// right up until the first part that breaks the pattern (`valueText` → `SelectValueText`, not
// `SelectValue`).
//
// `hiddenSelect` is not here: it carries no part in the anatomy (`../entity/anatomy.ts`), and the
// map's keys are checked against anatomy parts, not against the full set of rendered nodes.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Select,
  SelectLabel,
  SelectControl,
  SelectTrigger,
  SelectValueText,
  SelectClearTrigger,
  SelectIndicator,
  SelectPositioner,
  SelectContent,
  SelectList,
  SelectItemGroup,
  SelectItemGroupLabel,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from "./index.jsx";

/** The select's passport together with whatever draws each of its fifteen parts. */
export const kit = defineKitComponent(passport, {
  root: Select,
  label: SelectLabel,
  control: SelectControl,
  trigger: SelectTrigger,
  valueText: SelectValueText,
  clearTrigger: SelectClearTrigger,
  indicator: SelectIndicator,
  positioner: SelectPositioner,
  content: SelectContent,
  list: SelectList,
  itemGroup: SelectItemGroup,
  itemGroupLabel: SelectItemGroupLabel,
  item: SelectItem,
  itemText: SelectItemText,
  itemIndicator: SelectItemIndicator,
});
