// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Field,
  type FieldProps,
  FieldLabel,
  type FieldLabelProps,
  FieldInput,
  type FieldInputProps,
  FieldSelect,
  type FieldSelectProps,
  FieldTextarea,
  type FieldTextareaProps,
  FieldHelperText,
  type FieldHelperTextProps,
  FieldErrorText,
  type FieldErrorTextProps,
  FieldRequiredIndicator,
  type FieldRequiredIndicatorProps,
  FieldItem,
  type FieldItemProps,
  FieldContext,
  useFieldContext,
  useField,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
