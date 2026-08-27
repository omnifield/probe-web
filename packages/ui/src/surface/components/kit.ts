// КАРТА поверхности: часть паспорта → компонент, которым она рисуется (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Surface } from "./index.jsx";

/** Паспорт поверхности вместе с тем, чем рисуется её единственная часть. */
export const kit = defineKitComponent(passport, {
  root: Surface,
});
