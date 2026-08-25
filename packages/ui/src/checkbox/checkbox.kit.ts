// КАРТА чекбокса: часть паспорта → компонент, которым она рисуется (`PWEB-84`, `PWEB-114`).

import { defineKitComponent } from "../kit-form.js";
import { passport } from "./checkbox.anatomy.js";
import { Checkbox, CheckboxControl, CheckboxIndicator, CheckboxLabel } from "./checkbox.jsx";

/**
 * Паспорт чекбокса вместе с тем, чем рисуется каждая его часть.
 *
 * `hiddenInput` сюда не входит — у него нет части в паспорте (`checkbox.anatomy.ts`), и карте
 * адресовать нечего: ключи карты сверяются с частями анатомии, а не с полным списком узлов.
 */
export const kit = defineKitComponent(passport, {
  root: Checkbox,
  control: CheckboxControl,
  indicator: CheckboxIndicator,
  label: CheckboxLabel,
});
