# Radio Group

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole set — the group of choices where exactly one can be picked |
| label | the set's own label — describes the whole group, not any one choice |
| item | one choice — a clickable row; click anywhere on it to select |
| itemText | this item's own label text |
| itemControl | the visible circle — what the sliding indicator centers itself on top of when this item is chosen |
| indicator | the single sliding dot — jumps to sit over whichever item is currently checked |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | disabled | [data-disabled] | the whole group is disabled — no item can be chosen |
| root | invalid | [data-invalid] | the enclosing form rejected the value |
| root | required | [data-required] | the form will demand a choice on submit |
| label | disabled | [data-disabled] | the whole group is disabled — no item can be chosen |
| label | invalid | [data-invalid] | the enclosing form rejected the value |
| label | required | [data-required] | the form will demand a choice on submit |
| item | checked | [data-state="checked"] | this is the chosen item |
| item | unchecked | [data-state="unchecked"] | not the chosen item |
| item | disabled | [data-disabled] | this item cannot be chosen — its own flag, or the whole group's |
| item | readonly | [data-readonly] | the value is visible but nothing can be chosen |
| item | invalid | [data-invalid] | the enclosing form rejected the value |
| item | hover | [data-hover] | pointer is over this item |
| item | focus | [data-focus] | keyboard or pointer focus is on this item's hidden input — mirrored here since the input itself is invisible |
| item | focus-visible | [data-focus-visible] | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemText | checked | [data-state="checked"] | this is the chosen item |
| itemText | unchecked | [data-state="unchecked"] | not the chosen item |
| itemText | disabled | [data-disabled] | this item cannot be chosen — its own flag, or the whole group's |
| itemText | readonly | [data-readonly] | the value is visible but nothing can be chosen |
| itemText | invalid | [data-invalid] | the enclosing form rejected the value |
| itemText | hover | [data-hover] | pointer is over this item |
| itemText | focus | [data-focus] | keyboard or pointer focus is on this item's hidden input — mirrored here since the input itself is invisible |
| itemText | focus-visible | [data-focus-visible] | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemControl | checked | [data-state="checked"] | this is the chosen item |
| itemControl | unchecked | [data-state="unchecked"] | not the chosen item |
| itemControl | disabled | [data-disabled] | this item cannot be chosen — its own flag, or the whole group's |
| itemControl | readonly | [data-readonly] | the value is visible but nothing can be chosen |
| itemControl | invalid | [data-invalid] | the enclosing form rejected the value |
| itemControl | hover | [data-hover] | pointer is over this item |
| itemControl | focus | [data-focus] | keyboard or pointer focus is on this item's hidden input — mirrored here since the input itself is invisible |
| itemControl | focus-visible | [data-focus-visible] | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemControl | active | [data-active] | this item's circle is being pressed |
| indicator | disabled | [data-disabled] | the whole group is disabled |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which way the choices stack — also drives keyboard navigation (arrow keys) | `vertical` | [data-orientation] |

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| indicator | `--left` | kit | measured horizontal position of the checked item's circle |
| indicator | `--top` | kit | measured vertical position of the checked item's circle |
| indicator | `--width` | kit | measured width of the checked item's circle |
| indicator | `--height` | kit | measured height of the checked item's circle |

## Notes

<!-- user:start -->
## Overview

Radio Group is a set of choices where exactly one can be picked — a single sliding indicator dot
travels to sit over whichever item is currently checked, rather than each item drawing its own.

## Features

- **One indicator for the whole group, not one per item** — `indicator` is a single node that
  measures the checked item's `itemControl` and moves itself there via four CSS variables
  (`--left`/`--top`/`--width`/`--height`); it isn't nested inside each `item`.
- **Controlled or uncontrolled** — `value` + `onValueChange` for controlled use, `defaultValue` for
  uncontrolled.
- **Horizontal or vertical** — `orientation` (the kit's one real setting for this component) flips
  layout and which arrow keys move between items.
- **Disabling works at two levels** — the whole group (`disabled` on the root) or one item at a
  time (`disabled` on that `item`); either one produces the same `data-disabled` mark on the
  affected item(s).
- **Focus is mirrored as data** — real focus lands on each item's hidden `<input>`, invisible
  itself; `item`/`itemText`/`itemControl` all pick up `data-focus`/`data-focus-visible` mirrored
  onto them, the same device the select's own `control`/`valueText` use for their trigger's focus.
- **The real hidden `<input type="radio">` carries no address** — same device as the checkbox's own
  hidden input: without it the preview looks right but a click never actually changes the chosen
  value, since the real `onChange` lives on that exact node, not on `item`'s own `<label>`.
- **`itemControl` alone gets `active`** — `data-active` (the circle being pressed) is declared only
  there, not on `item`/`itemText`, since it's specifically the visible circle being pressed, not
  the whole row.

## Anatomy

```tsx
import {
  RadioGroup,
  RadioGroupLabel,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupItemHiddenInput,
  RadioGroupIndicator,
} from "@omnifield/probe-web-ui";

<RadioGroup>
  <RadioGroupLabel>{/* text — describes the whole group */}</RadioGroupLabel>
  {/* one RadioGroupItem per choice; `value` is required */}
  <RadioGroupItem value="standard">
    <RadioGroupItemControl />
    <RadioGroupItemText>{/* text */}</RadioGroupItemText>
    <RadioGroupItemHiddenInput />
  </RadioGroupItem>
  {/* the single sliding indicator, a sibling of the items, not nested in any one of them */}
  <RadioGroupIndicator />
</RadioGroup>
```

## Examples

### Basic, uncontrolled

```tsx
<RadioGroup defaultValue="React">
  <RadioGroupLabel>Framework</RadioGroupLabel>
  <For each={["React", "Solid", "Vue"]}>
    {(framework) => (
      <RadioGroupItem value={framework}>
        <RadioGroupItemControl />
        <RadioGroupItemText>{framework}</RadioGroupItemText>
        <RadioGroupItemHiddenInput />
      </RadioGroupItem>
    )}
  </For>
  <RadioGroupIndicator />
</RadioGroup>
```

### Controlled

```tsx
import { createSignal } from "solid-js";

const [value, setValue] = createSignal<string | null>(null);

<RadioGroup value={value()} onValueChange={(details) => setValue(details.value)}>
  <RadioGroupLabel>Framework</RadioGroupLabel>
  <For each={["React", "Solid", "Vue"]}>
    {(framework) => (
      <RadioGroupItem value={framework}>
        <RadioGroupItemControl />
        <RadioGroupItemText>{framework}</RadioGroupItemText>
        <RadioGroupItemHiddenInput />
      </RadioGroupItem>
    )}
  </For>
  <RadioGroupIndicator />
</RadioGroup>
```

### One item disabled

```tsx
<RadioGroup defaultValue="standard">
  <RadioGroupLabel>Delivery</RadioGroupLabel>
  <RadioGroupItem value="standard">
    <RadioGroupItemControl />
    <RadioGroupItemText>Standard</RadioGroupItemText>
    <RadioGroupItemHiddenInput />
  </RadioGroupItem>
  <RadioGroupItem value="sameDay" disabled>
    <RadioGroupItemControl />
    <RadioGroupItemText>Same day (currently unavailable)</RadioGroupItemText>
    <RadioGroupItemHiddenInput />
  </RadioGroupItem>
  <RadioGroupIndicator />
</RadioGroup>
```

### Horizontal

```tsx
<RadioGroup defaultValue="standard" orientation="horizontal">
  <RadioGroupLabel>Delivery</RadioGroupLabel>
  <For each={["standard", "express", "pickup"]}>
    {(value) => (
      <RadioGroupItem value={value}>
        <RadioGroupItemControl />
        <RadioGroupItemText>{value}</RadioGroupItemText>
        <RadioGroupItemHiddenInput />
      </RadioGroupItem>
    )}
  </For>
  <RadioGroupIndicator />
</RadioGroup>
```

## Styling hooks

`item`/`itemText`/`itemControl` all share `checked`/`unchecked`/`disabled`/`readonly`/`invalid`/
`hover`/`focus`/`focus-visible` (see `packages/skin`); `itemControl` alone adds `active`. `indicator`
carries only `disabled` — it has no `checked` mark of its own, since its whole job is showing
*where* the checked item is via its four position/size variables, not carrying a checked look
itself. Those variables (`--left`/`--top`/`--width`/`--height`) are measured off the actual checked
`itemControl`, so `indicator`'s own size/shape in CSS should match `itemControl`'s for the dot to
land convincingly on top of it.

## Accessibility

Radio Group follows the WAI-ARIA [Radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

| Key | What it does |
|---|---|
| `Tab` | Moves focus to the checked item, or the first item if none is checked |
| `Space` | Checks the focused item, if it isn't already |
| `ArrowDown` / `ArrowRight` | Moves focus to and checks the next item |
| `ArrowUp` / `ArrowLeft` | Moves focus to and checks the previous item |
<!-- user:end -->
