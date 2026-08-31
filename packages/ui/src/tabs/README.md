# Tabs

**Group:** — · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole set — the row of tabs together with the panel that's currently showing |
| list | the row (or column) of tabs — wraps every trigger plus the sliding indicator |
| trigger | one tab's button — switches to its panel when activated |
| content | one tab's panel — the content that shows while its tab is selected |
| indicator | the sliding marker under (or beside) whichever tab is selected — a plain box, no graphic of its own |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | focus | [data-focus] | some trigger in this set is focused |
| list | focus | [data-focus] | some trigger in this list is focused |
| trigger | selected | [data-selected] | this tab is the one currently showing |
| trigger | disabled | [data-disabled] | this tab cannot be selected |
| trigger | focus | [data-focus] | keyboard or pointer focus is on this tab |
| trigger | hover | :hover | pointer is over this tab |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this tab is being held down |
| content | selected | [data-selected] | this panel's own tab is selected — the panel is visible |
| indicator | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which way the tabs lay out — drives keyboard navigation (arrow keys) and aria, not just the look | `horizontal` | [data-orientation] |

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| indicator | `--left` | kit | measured horizontal position of the selected tab |
| indicator | `--top` | kit | measured vertical position of the selected tab |
| indicator | `--width` | kit | measured width of the selected tab |
| indicator | `--height` | kit | measured height of the selected tab |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
