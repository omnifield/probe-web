# Segment Group

**Group:** inputs · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the whole segmented control — the track and every choice in it |
| label | the set's own label — describes the whole group, not any one choice |
| item | one segment — a clickable slot; click anywhere on it to select |
| itemText | this segment's own label text |
| itemControl | this segment's own visible surface — what the sliding indicator sizes itself against |
| indicator | the single sliding pill — sits behind whichever segment is currently chosen |

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
| itemControl | active | [data-active] | this segment is being pressed |
| indicator | disabled | [data-disabled] | the whole group is disabled |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which way the segments lay out — also drives keyboard navigation (arrow keys) | `vertical` | [data-orientation] |

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| indicator | `--left` | kit | measured horizontal position of the chosen segment |
| indicator | `--top` | kit | measured vertical position of the chosen segment |
| indicator | `--width` | kit | measured width of the chosen segment |
| indicator | `--height` | kit | measured height of the chosen segment |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
