// КАРТА кнопки: часть паспорта → компонент, которым она рисуется (`PWEB-84`).
//
// Часть одна, и карта выглядит избыточной ровно до того момента, когда у кнопки появится вторая:
// тогда она появится ЗДЕСЬ, а не у двадцати потребителей порознь.

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./button.anatomy.js";
import { Button } from "./button.jsx";

/** Паспорт кнопки вместе с тем, чем рисуется её единственная часть. */
export const kit = defineKitComponent(passport, {
  root: Button,
});
