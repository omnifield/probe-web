# Select

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the select as a whole — label, control, and the floating dropdown together |
| label | the select's label |
| control | wraps the trigger and its indicators — the visible box the trigger sits in |
| valueText | shows the selected value(s), or the placeholder when none is chosen |
| trigger | the button that opens and closes the dropdown |
| clearTrigger | button that clears the current selection |
| indicator | open/closed indicator — an arrow placed by the consumer |
| positioner | positions the floating dropdown relative to the trigger |
| content | the floating dropdown itself — items live here, grouped or not |
| list | an inner listbox region inside the content — an optional alternative to nesting items straight in it |
| itemGroup | groups related items under one label |
| itemGroupLabel | label of an item group |
| item | one selectable option |
| itemText | an item's visible label |
| itemIndicator | selected-item indicator — a checkmark placed by the consumer |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | invalid | [data-invalid] | the select is invalid by the form's rules |
| root | readonly | [data-readonly] | a value is visible but cannot be changed |
| label | disabled | [data-disabled] | the select is disabled |
| label | invalid | [data-invalid] | the select is invalid by the form's rules |
| label | readonly | [data-readonly] | a value is visible but cannot be changed |
| label | required | [data-required] | the form will demand a value on submit |
| control | open | [data-state="open"] | the dropdown is open |
| control | closed | [data-state="closed"] | the dropdown is closed |
| control | focus | [data-focus] | focus is on the trigger (mirrored here — the control itself cannot be focused) |
| control | disabled | [data-disabled] | the select is disabled |
| control | invalid | [data-invalid] | the select is invalid by the form's rules |
| valueText | disabled | [data-disabled] | the select is disabled |
| valueText | invalid | [data-invalid] | the select is invalid by the form's rules |
| valueText | focus | [data-focus] | focus is on the trigger (mirrored here, same as on the control) |
| trigger | open | [data-state="open"] | the dropdown is open |
| trigger | closed | [data-state="closed"] | the dropdown is closed |
| trigger | disabled | [data-disabled] | the select is disabled — the trigger does not respond |
| trigger | invalid | [data-invalid] | the select is invalid by the form's rules |
| trigger | readonly | [data-readonly] | a value is visible but cannot be changed |
| trigger | placeholder | [data-placeholder-shown] | no value is chosen yet — the placeholder text is showing |
| trigger | hover | :hover | pointer is over the trigger |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | the trigger is being held down |
| clearTrigger | invalid | [data-invalid] | the select is invalid by the form's rules |
| clearTrigger | disabled | :disabled | the select is disabled — clicking it does nothing |
| clearTrigger | hover | :hover | pointer is over the button |
| clearTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| clearTrigger | active | :active | the button is being held down |
| indicator | open | [data-state="open"] | the dropdown is open |
| indicator | closed | [data-state="closed"] | the dropdown is closed |
| indicator | disabled | [data-disabled] | the select is disabled |
| indicator | invalid | [data-invalid] | the select is invalid by the form's rules |
| indicator | readonly | [data-readonly] | a value is visible but cannot be changed |
| positioner | — | — | — |
| content | open | [data-state="open"] | the dropdown is open |
| content | closed | [data-state="closed"] | the dropdown is closed |
| list | — | — | — |
| itemGroup | disabled | [data-disabled] | the select is disabled |
| itemGroupLabel | — | — | — |
| item | checked | [data-state="checked"] | the item is selected |
| item | unchecked | [data-state="unchecked"] | the item is not selected |
| item | highlighted | [data-highlighted] | the item is highlighted — keyboard or pointer moved to it, not yet chosen |
| item | disabled | [data-disabled] | the item cannot be selected |
| itemText | checked | [data-state="checked"] | the item is selected |
| itemText | unchecked | [data-state="unchecked"] | the item is not selected |
| itemText | highlighted | [data-highlighted] | the item is highlighted — keyboard or pointer moved to it, not yet chosen |
| itemText | disabled | [data-disabled] | the item cannot be selected |
| itemIndicator | checked | [data-state="checked"] | the item is selected |
| itemIndicator | unchecked | [data-state="unchecked"] | the item is not selected |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| multiple | whether several items can be selected at once | `false` | — |

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| positioner | `--reference-width` | kit | measured width of the trigger — lets the dropdown match it |
| positioner | `--reference-height` | kit | measured height of the trigger |
| positioner | `--available-width` | kit | room left to the nearest viewport edge, widthwise |
| positioner | `--available-height` | kit | room left to the nearest viewport edge, heightwise — caps a long dropdown |

## Notes

<!-- user:start -->
Select is a floating dropdown over a data-driven collection of items — the kit's first component
that is both composite and floating at once. Fifteen parts, the largest anatomy in the kit; it
shares its item-collection shape with the listbox (its nearest sibling, no floating layer) and its
floating-layer mechanics with the popover.

### Composition

```tsx
import {
  Select,
  SelectLabel,
  SelectControl,
  SelectTrigger,
  SelectValueText,
  SelectClearTrigger,
  SelectIndicator,
  SelectPositioner,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectHiddenSelect,
} from "@omnifield/probe-web-ui";

<Select items={[{ value: "apple", label: "Apple" }, { value: "banana", label: "Banana" }]}>
  <SelectLabel>Fruit</SelectLabel>
  <SelectControl>
    <SelectTrigger>
      <SelectValueText placeholder="Pick a fruit" />
    </SelectTrigger>
    <SelectClearTrigger>×</SelectClearTrigger>
    <SelectIndicator>▾</SelectIndicator>
  </SelectControl>
  <SelectPositioner>
    <SelectContent>
      <SelectItem item={{ value: "apple", label: "Apple" }}>
        <SelectItemText>Apple</SelectItemText>
        <SelectItemIndicator>✓</SelectItemIndicator>
      </SelectItem>
    </SelectContent>
  </SelectPositioner>
  <SelectHiddenSelect />
</Select>
```

`Select` takes plain `items` (`{ value, label }[]`), not a `collection` — it builds the real Ark
`ListCollection` internally, memoized, the same device the listbox uses. `SelectHiddenSelect`
renders the real, visually hidden native `<select>` that carries form submission, autofill, and
`change` — Ark never addresses it (no `data-scope`/`data-part`), so it isn't stylable through the
passport, same as the checkbox's own hidden input.

### `list` — real, but undocumented upstream

`list` is a genuine anatomy part (Ark ships it, `SelectList` exists as an export) but is absent
from `ark-ui.com`'s own usage example and prose — checked directly against the source, not assumed
missing because unused. It's an optional inner listbox region: items can nest straight inside
`content` (as in the example above) or inside `content` → `list` when a consumer wants a separate
scroll region from the content's own chrome. The kit declares it honestly either way — taking an
anatomy piecemeal, dropping parts nobody has used yet, is exactly the discipline the accordion and
checkbox already avoid.

### States worth calling out

- **`data-state` is unconditional**, unlike the accordion's `item`: `control`/`trigger`/
  `indicator`/`content` always carry either `data-state="open"` or `data-state="closed"` — never
  absent — because the connector writes it that way regardless of animation. That's a real
  difference from the accordion's `itemContent`, whose `open` mark can vanish entirely.
- **Focus is mirrored as data.** Real DOM focus lands on `trigger` (a genuine `<button>`, hence its
  native `:hover`/`:focus-visible`/`:active`), but `control` and `valueText` — siblings that can
  never receive focus themselves — get `data-focus` mirrored onto them, so a rule can still say
  "the control while its trigger is focused." Same device as the checkbox's hidden input.
- **`disabled` picks the data mark over the native one wherever both exist.** `trigger` carries a
  real `disabled` attribute AND `data-disabled` — the data mark is the one declared, matching the
  button's own passport. `clearTrigger` gets ONLY the native `disabled` (the connector never writes
  `data-disabled` on it), so its passport declares `:disabled` honestly instead of inventing a data
  mark that never appears.
- Three marks the upstream docs mention but the connector does not actually back up were left out
  on purpose: `data-highlighted` on `itemIndicator`, `data-placement`/`data-side` (floating-ui
  outcomes, not an author-chosen value), and `data-activedescendant` (ARIA wiring, not a look).

### Reference: assembly example

`playground/assemblies.ts` has one worked `RenderTree` example (`basic`) showing label, trigger
value, and items all driven by data — no hardcoded item list, unlike this component's very first
pass (which baked a hand-built collection and a literal `fruits` array into the assembly and was
corrected out). Most consumers should reach for the plain JSX composition above; the tree format is
a secondary reference for realistic data shapes.
<!-- user:end -->
