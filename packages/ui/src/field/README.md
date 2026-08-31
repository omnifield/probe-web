# Field

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole field — label, control, helper/error text and required marker, wired into one addressable, accessible group |
| label | the field's own label |
| input | a plain text control wired to the field — one of three interchangeable renderers |
| select | a plain native dropdown control wired to the field — one of three interchangeable renderers |
| textarea | a plain multi-line text control wired to the field — one of three interchangeable renderers |
| helperText | hint text — stays mounted regardless of validity |
| errorText | the validation message — mounted only while the field is invalid |
| requiredIndicator | the required marker — mounted only while the field is required; defaults to "*" |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | disabled | [data-disabled] | the whole field is disabled |
| root | invalid | [data-invalid] | the enclosing form rejected the value |
| root | readonly | [data-readonly] | the value is visible, changing it is not possible |
| label | disabled | [data-disabled] | the whole field is disabled |
| label | invalid | [data-invalid] | the enclosing form rejected the value |
| label | readonly | [data-readonly] | the value is visible, changing it is not possible |
| label | required | [data-required] | the form will demand a value on submit |
| input | invalid | [data-invalid] | the enclosing form rejected the value |
| input | required | [data-required] | the form will demand a value on submit |
| input | readonly | [data-readonly] | the value is visible, changing it is not possible |
| input | disabled | :disabled | this control cannot be used |
| input | hover | :hover | pointer is over this control |
| input | focus | :focus | this control has keyboard or pointer focus |
| input | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| select | invalid | [data-invalid] | the enclosing form rejected the value |
| select | required | [data-required] | the form will demand a value on submit |
| select | readonly | [data-readonly] | the value is visible, changing it is not possible |
| select | disabled | :disabled | this control cannot be used |
| select | hover | :hover | pointer is over this control |
| select | focus | :focus | this control has keyboard or pointer focus |
| select | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| textarea | invalid | [data-invalid] | the enclosing form rejected the value |
| textarea | required | [data-required] | the form will demand a value on submit |
| textarea | readonly | [data-readonly] | the value is visible, changing it is not possible |
| textarea | disabled | :disabled | this control cannot be used |
| textarea | hover | :hover | pointer is over this control |
| textarea | focus | :focus | this control has keyboard or pointer focus |
| textarea | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| helperText | disabled | [data-disabled] | the whole field is disabled |
| errorText | — | — | — |
| requiredIndicator | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Field is a composition helper, not a widget — unlike every other component in the kit, there is no
state machine underneath it. Its whole job is wiring one label, one control, a helper message, an
error message, and a required marker into one addressable, accessible group, whether that control
is a plain `<input>`/`<select>`/`<textarea>` or a foreign component like this kit's own `Checkbox`
or `Switch`.

## Features

- **Three interchangeable native renderers** — `input`/`select`/`textarea` all wire into the same
  field state; use whichever one matches the data, never more than one at a time.
- **Foreign controls wire in through context, not props** — `FieldContext`/`useFieldContext`/
  `useField` are re-exported as-is (not wrapped) because Ark's own guidance is that a custom
  control reads the field's context itself; `Field` never pushes props down to arbitrary children
  on its own.
- **Conditionally mounted, not conditionally styled** — `requiredIndicator` only exists in the DOM
  while `required` is set, `errorText` only while `invalid` is set; `helperText` stays mounted
  regardless. A skin has nothing to hide with CSS here — the kit already didn't render the node.
- **`requiredIndicator` defaults to `"*"`**, but takes a `fallback` prop the same shape as the
  checkbox's own indicator — supply different content for the non-required case if `"*"` alone
  isn't the right default for a given design.
- **`FieldItem` scopes one repeated instance** — renders no node of its own, only re-addresses ids
  and passes `children` through; useful when several fields share meaning but need independently
  addressable label/control/error ids (e.g. a list of similar inputs). It carries no anatomy part
  of its own — nothing for the kit to draw or style.
- **`select` takes real `<option>` children** — a genuine native `<select>`, not one of the kit's
  own listbox-shaped components; the kit's content-genus vocabulary (text/icon/component) has no
  slot for raw `<option>` elements, a named gap, not something worked around here.
- **No settings at all** — declared as a fact: none of `required`/`invalid`/`readOnly`/`disabled`
  is part of the kit's closed settings vocabulary.

## Anatomy

```tsx
import {
  Field,
  FieldLabel,
  FieldInput,
  FieldHelperText,
  FieldErrorText,
  FieldRequiredIndicator,
} from "@omnifield/probe-web-ui";

<Field required>
  <FieldLabel>
    {/* text */}
    <FieldRequiredIndicator />
  </FieldLabel>
  {/* exactly one of: FieldInput, FieldSelect, FieldTextarea — or a foreign control via context */}
  <FieldInput />
  <FieldHelperText>{/* text */}</FieldHelperText>
  <FieldErrorText>{/* text */}</FieldErrorText>
</Field>
```

## Examples

### Basic, with a plain input

```tsx
<Field>
  <FieldLabel>Name</FieldLabel>
  <FieldInput />
  <FieldHelperText>As it appears on your ID</FieldHelperText>
  <FieldErrorText>Name is required</FieldErrorText>
</Field>
```

### Required and invalid

```tsx
<Field required invalid>
  <FieldLabel>
    Name
    <FieldRequiredIndicator />
  </FieldLabel>
  <FieldInput />
  <FieldErrorText>Name is required</FieldErrorText>
</Field>
```

### A select, with real options

```tsx
import { FieldSelect } from "@omnifield/probe-web-ui";

<Field>
  <FieldLabel>Country</FieldLabel>
  <FieldSelect>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
  </FieldSelect>
</Field>
```

### An autoresizing textarea

```tsx
import { FieldTextarea } from "@omnifield/probe-web-ui";

<Field>
  <FieldLabel>Notes</FieldLabel>
  <FieldTextarea autoresize />
</Field>
```

### Wiring in a foreign control

`FieldContext` hands a custom or foreign control the same props Ark would give a native
`<input>` — useful when neither `input`/`select`/`textarea` fits and there's no dedicated
integration for the control in question:

```tsx
import { FieldContext } from "@omnifield/probe-web-ui";

<Field invalid>
  <FieldLabel>Any control</FieldLabel>
  <FieldContext>{(context) => <input {...context().getInputProps()} />}</FieldContext>
  <FieldErrorText>This field has an error</FieldErrorText>
</Field>
```

Composing one of the kit's own controls (e.g. `Checkbox`) works the same way, since that control
reads the field's context internally.

## Styling hooks

`root`/`label`/`input`/`select`/`textarea`/`helperText` all carry combinations of
`data-disabled`/`data-invalid`/`data-readonly`/`data-required` (see `packages/skin`) — but
`errorText` and `requiredIndicator` carry no state marks of their own, because they don't need any:
their very presence in the DOM already is the state. `input`/`select`/`textarea` mix native
pseudo-classes (`:disabled`, `:hover`, `:focus`, `:focus-visible`) with kit-declared `data-*`
attributes (`invalid`/`required`/`readonly`) on the same node — disabledness in particular is native
`:disabled`, not `data-disabled`, since these are real form controls the browser already tracks.

## Accessibility

Field has no dedicated WAI-ARIA widget pattern or keyboard table of its own — it's a composition
helper, not an interactive control, and carries no state machine to drive keyboard behavior. Its
accessibility contribution is wiring: `label` is a real `<label>` associated with its control,
`helperText`/`errorText` are connected via `aria-describedby`, and `required`/`invalid` propagate to
the control's own `aria-required`/`aria-invalid` — the actual keyboard behavior belongs entirely to
whichever control (`input`, `select`, `textarea`, or a foreign one) is composed inside.
<!-- user:end -->
