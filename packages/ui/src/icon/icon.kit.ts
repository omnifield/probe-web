// КАРТА значка: часть паспорта → компонент, которым она рисуется (`PWEB-84`).

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./icon.anatomy.js";
import { Icon } from "./icon.jsx";

/** Паспорт значка вместе с тем, чем рисуется его единственная часть. */
export const kit = defineKitComponent(passport, {
  root: Icon,
});
