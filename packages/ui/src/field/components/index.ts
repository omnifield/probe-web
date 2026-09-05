export { Field, type FieldProps } from "./root.js";
export { FieldLabel, type FieldLabelProps } from "./label.js";
export { FieldInput, type FieldInputProps } from "./input.js";
export { FieldSelect, type FieldSelectProps } from "./select.js";
export { FieldTextarea, type FieldTextareaProps } from "./textarea.js";
export { FieldHelperText, type FieldHelperTextProps } from "./helper-text.js";
export { FieldErrorText, type FieldErrorTextProps } from "./error-text.js";
export { FieldRequiredIndicator, type FieldRequiredIndicatorProps } from "./required-indicator.js";
export { FieldItem, type FieldItemProps } from "./item.js";
export { FieldContext, useFieldContext, useField } from "@ark-ui/solid/field";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Field } from "./root.js";
import { FieldLabel } from "./label.js";
import { FieldInput } from "./input.js";
import { FieldSelect } from "./select.js";
import { FieldTextarea } from "./textarea.js";
import { FieldHelperText } from "./helper-text.js";
import { FieldErrorText } from "./error-text.js";
import { FieldRequiredIndicator } from "./required-indicator.js";

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
