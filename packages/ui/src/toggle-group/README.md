# Toggle Group

**Group:** inputs · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the whole row (or column) of buttons |
| item | one button — press it to toggle on/off |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | disabled | [data-disabled] | the whole set is disabled — no item can be pressed |
| root | focus | [data-focus] | some item in this set is focused |
| item | on | [data-state="on"] | this button is pressed |
| item | off | [data-state="off"] | this button is not pressed |
| item | disabled | [data-disabled] | this button cannot be pressed — its own flag, or the whole group's |
| item | focus | [data-focus] | the roving-tabindex machine considers this item the focused one |
| item | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| item | hover | :hover | pointer is over this button |
| item | active | :active | this button is being held down |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which way the buttons lay out — also drives keyboard navigation (arrow keys) | `horizontal` | [data-orientation] |
| multiple | whether several buttons can stay pressed at once, instead of just one | `false` | — |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
