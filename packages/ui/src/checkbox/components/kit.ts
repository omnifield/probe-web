// КАРТА чекбокса: часть паспорта → компонент, которым она рисуется (`PWEB-84`, `PWEB-114`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Checkbox, CheckboxControl, CheckboxHiddenInput, CheckboxIndicator, CheckboxLabel } from "./index.jsx";

/**
 * Паспорт чекбокса вместе с тем, чем рисуется каждая его часть.
 *
 * `hiddenInput` сидит вне `parts` — у него нет части в паспорте (`../entity/anatomy.ts`), и карте
 * с анатомией его адресовать нечего. Но узел настоящий и нужный: реальный `onChange`, который
 * меняет отметку, висит именно на нём, а не на `label`/`control` (`PWEB-152`) — живёт в `extras`,
 * адресуемым по имени, не по анатомии.
 */
export const kit = defineKitComponent(
  passport,
  {
    root: Checkbox,
    control: CheckboxControl,
    indicator: CheckboxIndicator,
    label: CheckboxLabel,
  },
  { hiddenInput: CheckboxHiddenInput },
);
