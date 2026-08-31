# Checkbox

**Group:** inputs · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the checkbox as a whole — a `<label>` node; clicking it toggles the mark |
| control | the control frame — the visible square that holds the checked-mark indicator |
| indicator | the checked-mark indicator — a check or a dash, placed by the consumer |
| label | the checkbox's label |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | checked | [data-state="checked"] | the checkbox is checked |
| root | unchecked | [data-state="unchecked"] | the checkbox is unchecked |
| root | indeterminate | [data-state="indeterminate"] | partially checked — typically a checkbox summarizing partially-checked children |
| root | disabled | [data-disabled] | the checkbox is disabled — it cannot be toggled |
| root | readonly | [data-readonly] | the checkbox is read-only — its state is visible but cannot be toggled |
| root | invalid | [data-invalid] | the checkbox is invalid per the form's validation rules |
| root | required | [data-required] | the checkbox is required for form submission |
| root | hover | [data-hover] | the pointer is over the checkbox |
| root | active | [data-active] | the checkbox is being pressed by the pointer |
| root | focus | [data-focus] | focus is on the checkbox |
| root | focus-visible | [data-focus-visible] | focus arrived from the keyboard — a focus ring belongs here |
| control | checked | [data-state="checked"] | the checkbox is checked |
| control | unchecked | [data-state="unchecked"] | the checkbox is unchecked |
| control | indeterminate | [data-state="indeterminate"] | partially checked — typically a checkbox summarizing partially-checked children |
| control | disabled | [data-disabled] | the checkbox is disabled — it cannot be toggled |
| control | readonly | [data-readonly] | the checkbox is read-only — its state is visible but cannot be toggled |
| control | invalid | [data-invalid] | the checkbox is invalid per the form's validation rules |
| control | required | [data-required] | the checkbox is required for form submission |
| control | hover | [data-hover] | the pointer is over the checkbox |
| control | active | [data-active] | the checkbox is being pressed by the pointer |
| control | focus | [data-focus] | focus is on the checkbox |
| control | focus-visible | [data-focus-visible] | focus arrived from the keyboard — a focus ring belongs here |
| indicator | checked | [data-state="checked"] | the checkbox is checked |
| indicator | unchecked | [data-state="unchecked"] | the checkbox is unchecked |
| indicator | indeterminate | [data-state="indeterminate"] | partially checked — typically a checkbox summarizing partially-checked children |
| indicator | disabled | [data-disabled] | the checkbox is disabled — it cannot be toggled |
| indicator | readonly | [data-readonly] | the checkbox is read-only — its state is visible but cannot be toggled |
| indicator | invalid | [data-invalid] | the checkbox is invalid per the form's validation rules |
| indicator | required | [data-required] | the checkbox is required for form submission |
| indicator | hover | [data-hover] | the pointer is over the checkbox |
| indicator | active | [data-active] | the checkbox is being pressed by the pointer |
| indicator | focus | [data-focus] | focus is on the checkbox |
| indicator | focus-visible | [data-focus-visible] | focus arrived from the keyboard — a focus ring belongs here |
| label | checked | [data-state="checked"] | the checkbox is checked |
| label | unchecked | [data-state="unchecked"] | the checkbox is unchecked |
| label | indeterminate | [data-state="indeterminate"] | partially checked — typically a checkbox summarizing partially-checked children |
| label | disabled | [data-disabled] | the checkbox is disabled — it cannot be toggled |
| label | readonly | [data-readonly] | the checkbox is read-only — its state is visible but cannot be toggled |
| label | invalid | [data-invalid] | the checkbox is invalid per the form's validation rules |
| label | required | [data-required] | the checkbox is required for form submission |
| label | hover | [data-hover] | the pointer is over the checkbox |
| label | active | [data-active] | the checkbox is being pressed by the pointer |
| label | focus | [data-focus] | focus is on the checkbox |
| label | focus-visible | [data-focus-visible] | focus arrived from the keyboard — a focus ring belongs here |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Checkbox is a form input — one control a person toggles between checked and unchecked, and which
can also sit in a third, "indeterminate" state (partially checked, typically used for a checkbox
that summarizes a set of other checkboxes). It was the first *form* component the kit took from Ark
UI (`PWEB-114`), following the same anatomy-owns-the-address approach as `accordion`: Ark itself
sets the `data-scope`/`data-part` addresses, the kit only wraps.

## Features

- **Three-state, not two** — `checked` / `defaultChecked` accept `boolean | "indeterminate"`, and
  `root`/`control`/`indicator`/`label` all carry the matching `data-state` mark.
- **Controlled or uncontrolled** — `checked` + `onCheckedChange` for controlled use, `defaultChecked`
  for uncontrolled.
- **Disableable** — `disabled` stops the checkbox from toggling; `root`, `control`, `indicator`, and
  `label` all pick up `data-disabled` together.
- **Read-only** — `readOnly` shows the current state without letting it change, marked
  `data-readonly` on every part.
- **Form-validation hooks** — `invalid` and `required` are plain booleans you set from your own
  validation logic; the kit only renders the corresponding `data-invalid` / `data-required` marks,
  it never computes validity itself.
- **Interactive states carried on every part** — `hover`, `active`, `focus`, and `focus-visible` are
  all marked identically on `root`, `control`, `indicator`, and `label`, so a skin can style
  whichever part needs to react.
- **Real form participation** — `name` and `value` (default `"on"`) on the root make the checkbox
  submit like a native `<input type="checkbox">`, because underneath, it is one.

## Anatomy

```tsx
import {
  Checkbox,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxLabel,
  CheckboxHiddenInput,
} from "@omnifield/probe-web-ui";

<Checkbox>
  <CheckboxControl>
    <CheckboxIndicator>{/* checked mark: text or icon */}</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>{/* text */}</CheckboxLabel>
  <CheckboxHiddenInput />
</Checkbox>
```

`CheckboxHiddenInput` is not optional decoration: it's a real `<input type="checkbox">`, and the
actual `onChange` that flips the checked state lives on *that* node, not on `control` or `label`
(`PWEB-152`). Omit it and the checkbox renders correctly but clicking it does nothing. It also has
no passport part of its own — it carries no visual states or marks, unlike the other four parts.

## Examples

### Uncontrolled, starting checked

`defaultChecked` sets the initial state without you having to manage it:

```tsx
<Checkbox defaultChecked>
  <CheckboxControl>
    <CheckboxIndicator>✓</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>I agree to the terms and conditions</CheckboxLabel>
  <CheckboxHiddenInput />
</Checkbox>
```

### Controlled

`checked` + `onCheckedChange` hand you the state instead of letting the checkbox own it:

```tsx
import { createSignal } from "solid-js";

const [checked, setChecked] = createSignal<boolean | "indeterminate">(false);

<Checkbox checked={checked()} onCheckedChange={(details) => setChecked(details.checked)}>
  <CheckboxControl>
    <CheckboxIndicator>✓</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>Subscribe to updates</CheckboxLabel>
  <CheckboxHiddenInput />
</Checkbox>
```

### Indeterminate, with its own mark

`checked="indeterminate"` puts the checkbox in the third state. `CheckboxIndicator` takes its own
`indeterminate` prop — mount two, and each renders only for its own state, so the checked mark and
the indeterminate mark can look different (a check versus a dash, for instance):

```tsx
<Checkbox checked="indeterminate">
  <CheckboxControl>
    <CheckboxIndicator>✓</CheckboxIndicator>
    <CheckboxIndicator indeterminate>–</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>Select all</CheckboxLabel>
  <CheckboxHiddenInput />
</Checkbox>
```

### Disabled

```tsx
<Checkbox disabled defaultChecked>
  <CheckboxControl>
    <CheckboxIndicator>✓</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>Sync automatically (managed by your admin)</CheckboxLabel>
  <CheckboxHiddenInput />
</Checkbox>
```

### Submitting with a form

`name` and `value` turn the checkbox into a real form field — `FormData` picks it up like any
native checkbox input, checked or not:

```tsx
<form
  onSubmit={(event) => {
    event.preventDefault();
    console.log(new FormData(event.currentTarget).get("terms"));
  }}
>
  <Checkbox name="terms" value="accepted">
    <CheckboxControl>
      <CheckboxIndicator>✓</CheckboxIndicator>
    </CheckboxControl>
    <CheckboxLabel>I agree to the terms and conditions</CheckboxLabel>
    <CheckboxHiddenInput />
  </Checkbox>
  <button type="submit">Submit</button>
</form>
```

## Styling hooks

`checked` / `unchecked` / `indeterminate` / `disabled` / `readonly` / `invalid` / `required` /
`hover` / `active` / `focus` / `focus-visible` are all real `data-*` marks (see the States table
above), and — unusually for this kit — every one of them is repeated identically on `root`,
`control`, `indicator`, *and* `label`, not just on whichever part logically owns the state. That
means a skin can select at whatever granularity it needs — style only the `indicator` differently
per state without touching the `label`, or select the shared `root` mark once and let it cascade —
without hunting for which part actually carries a given attribute (see `packages/skin`).
`CheckboxHiddenInput` carries none of these marks; it stays visually hidden and isn't meant to be
styled directly.

## Accessibility

Checkbox follows the WAI-ARIA [Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/).

| Key | What it does |
|---|---|
| `Space` | Toggles the checkbox between checked and unchecked |

`Tab` / `Shift + Tab` move focus onto and off of the checkbox the same way they do for any native
form control — that's browser behavior, not something this pattern defines on top.
<!-- user:end -->
