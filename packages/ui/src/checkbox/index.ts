// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export {
  Checkbox,
  CheckboxControl,
  type CheckboxControlProps,
  CheckboxHiddenInput,
  type CheckboxHiddenInputProps,
  CheckboxIndicator,
  type CheckboxIndicatorProps,
  CheckboxLabel,
  type CheckboxLabelProps,
  type CheckboxProps,
} from "./checkbox.jsx";
export { anatomy, parts, passport } from "./checkbox.anatomy.js";
export { kit } from "./checkbox.kit.js";
