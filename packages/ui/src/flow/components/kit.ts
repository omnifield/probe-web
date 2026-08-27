// КАРТА ряда: часть паспорта → компонент, которым она рисуется (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Flow, FlowItem } from "./index.jsx";

/** Паспорт ряда вместе с тем, чем рисуется каждая его часть. */
export const kit = defineKitComponent(passport, {
  root: Flow,
  item: FlowItem,
});
