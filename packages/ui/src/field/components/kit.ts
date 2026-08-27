// MAP of the field: passport part → the component that draws it (`PWEB-84`).
//
// `FieldItem`/`FieldContext`/`useFieldContext`/`useField` are not here: none of them carry a part
// in the anatomy (`../entity/anatomy.ts`) — `Item` renders no node of its own at all, and the
// other three are plain Solid/composition primitives, not drawn parts.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Field,
  FieldLabel,
  FieldInput,
  FieldSelect,
  FieldTextarea,
  FieldHelperText,
  FieldErrorText,
  FieldRequiredIndicator,
} from "./index.jsx";

/** The field's passport together with whatever draws each of its eight parts. */
export const kit = defineKitComponent(passport, {
  root: Field,
  label: FieldLabel,
  input: FieldInput,
  select: FieldSelect,
  textarea: FieldTextarea,
  helperText: FieldHelperText,
  errorText: FieldErrorText,
  requiredIndicator: FieldRequiredIndicator,
});
