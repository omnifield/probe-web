import { createAnatomy } from "@web-core/skin/model";

// Машины поля у Zag нет вовсе — анатомия объявлена китом целиком, как у `button`/`diagram`.
// Имена совпадают с адресами, которые проставляет реальная композиция.
export const anatomy = createAnatomy("field").parts(
  "root",
  "errorText",
  "helperText",
  "input",
  "label",
  "select",
  "textarea",
  "requiredIndicator",
);

export const anatomyParts = anatomy.build();
