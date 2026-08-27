import {
  FieldRoot as ArkRoot,
  FieldLabel as ArkLabel,
  FieldInput as ArkInput,
  FieldSelect as ArkSelect,
  FieldTextarea as ArkTextarea,
  FieldHelperText as ArkHelperText,
  FieldErrorText as ArkErrorText,
  FieldRequiredIndicator as ArkRequiredIndicator,
  FieldItem as ArkItem,
  FieldContext,
  useFieldContext,
  useField,
  type FieldRootProps as ArkRootProps,
  type FieldLabelProps as ArkLabelProps,
  type FieldInputProps as ArkInputProps,
  type FieldSelectProps as ArkSelectProps,
  type FieldTextareaProps as ArkTextareaProps,
  type FieldHelperTextProps as ArkHelperTextProps,
  type FieldErrorTextProps as ArkErrorTextProps,
  type FieldRequiredIndicatorProps as ArkRequiredIndicatorProps,
  type FieldItemProps as ArkItemProps,
} from "@ark-ui/solid/field";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Field — a composition helper, not a widget (`ark-ui.com/docs/components/field`). Unlike every
// other component in the kit, there is no `@zag-js` machine underneath it at all — no open/closed,
// no checked/unchecked, nothing to toggle. Its whole job is wiring one label, one control (an
// `<input>`/`<select>`/`<textarea>`, OR a foreign component reading its context), a helper
// message, an error message, and a required marker into ONE addressable, accessible group.
//
// Same device as the rest of the kit for the parts that DO have an address: Ark sets it itself
// (spreads `parts.*.attrs` inside every `getXxxProps()`, `use-field.ts`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `FieldContext`/`useFieldContext`/`useField` are re-exported AS IS, not wrapped: they are the
// documented way to wire a FOREIGN control (our own `Checkbox`/`Switch`/`Select`, or anything
// else) into a field — Ark's own guidance is that a custom control reads the context itself,
// Field does not push props down to arbitrary children on its own. Leaving these out would mean
// a consumer reaching past the kit into `@ark-ui/solid/field` directly for the one thing the
// field is FOR, the same reason `createListCollection` is re-exported from the select.
//
// `FieldItem` carries no address (`../entity/anatomy.ts`, "carries NO part") and is not thin in
// the usual sense either — it renders no node of its OWN at all, only re-scopes ids for one
// repeated instance and passes `children` through. Still re-exported: it is real, documented API
// surface, useful standalone even though the kit's registry has nothing to draw for it.

/** Props of `Field` — the root. */
export type FieldProps = ArkRootProps;

/**
 * The field's root — ONE `<div role="group">` node plus context for its own parts and for any
 * foreign control that reads it.
 *
 * @example
 * ```tsx
 * <Field required>
 *   <FieldLabel>
 *     Name
 *     <FieldRequiredIndicator />
 *   </FieldLabel>
 *   <FieldInput />
 *   <FieldHelperText>As it appears on your ID</FieldHelperText>
 *   <FieldErrorText>Name is required</FieldErrorText>
 * </Field>
 * ```
 */
export function Field(props: FieldProps) {
  traceLife("ui.field");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `FieldLabel`. */
export type FieldLabelProps = ArkLabelProps;

/** The field's label — ONE `<label>` node. */
export function FieldLabel(props: FieldLabelProps) {
  traceLife("ui.field-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Props of `FieldInput`. */
export type FieldInputProps = ArkInputProps;

/** A plain `<input>` control wired to the field — ONE node; one of three interchangeable renderers. */
export function FieldInput(props: FieldInputProps) {
  traceLife("ui.field-input");

  return <ArkInput {...dropAddress(props)} />;
}

/** Props of `FieldSelect`. */
export type FieldSelectProps = ArkSelectProps;

/**
 * A plain native `<select>` control wired to the field — ONE node; one of three interchangeable
 * renderers. Takes real `<option>` children — the kit's content-genus vocabulary (text/icon/
 * component) has no place for those yet, a gap named, not fixed, in `playground/parts.ts`.
 */
export function FieldSelect(props: FieldSelectProps) {
  traceLife("ui.field-select");

  return <ArkSelect {...dropAddress(props)} />;
}

/** Props of `FieldTextarea`. */
export type FieldTextareaProps = ArkTextareaProps;

/** A plain `<textarea>` control wired to the field — ONE node; one of three interchangeable renderers. */
export function FieldTextarea(props: FieldTextareaProps) {
  traceLife("ui.field-textarea");

  return <ArkTextarea {...dropAddress(props)} />;
}

/** Props of `FieldHelperText`. */
export type FieldHelperTextProps = ArkHelperTextProps;

/** Helper/hint text — ONE node, always mounted regardless of validity. */
export function FieldHelperText(props: FieldHelperTextProps) {
  traceLife("ui.field-helper-text");

  return <ArkHelperText {...dropAddress(props)} />;
}

/** Props of `FieldErrorText`. */
export type FieldErrorTextProps = ArkErrorTextProps;

/** Error message — ONE node, mounted ONLY while the field is invalid, unmounted otherwise. */
export function FieldErrorText(props: FieldErrorTextProps) {
  traceLife("ui.field-error-text");

  return <ArkErrorText {...dropAddress(props)} />;
}

/** Props of `FieldRequiredIndicator`. */
export type FieldRequiredIndicatorProps = ArkRequiredIndicatorProps;

/**
 * Required marker — ONE node, mounted ONLY while the field is required, unmounted otherwise.
 * Defaults to `"*"`; the consumer may place a different glyph or word as children.
 */
export function FieldRequiredIndicator(props: FieldRequiredIndicatorProps) {
  traceLife("ui.field-required-indicator");

  return <ArkRequiredIndicator {...dropAddress(props)} />;
}

/** Props of `FieldItem`. */
export type FieldItemProps = ArkItemProps;

/**
 * Scopes one repeated field instance by `value` — renders NO node of its own, only re-addresses
 * ids for the instance and passes `children` through. Not in the anatomy (`../entity/anatomy.ts`):
 * there is nothing here for `dropAddress` to strip.
 */
export function FieldItem(props: FieldItemProps) {
  traceLife("ui.field-item");

  return <ArkItem {...props} />;
}

export { FieldContext, useFieldContext, useField };
