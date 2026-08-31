# Table

**Group:** — · **Genus:** component · **Footprint:** wide

## Anatomy

| part | meaning |
|---|---|
| root | the whole table |
| caption | the table's own caption — describes what the table holds |
| head | wraps the header row(s) |
| headRow | one row of column headers |
| headerCell | one column's header — carries the sorted look for that column, whether or not it holds a button |
| headerSortTrigger | the button that toggles this column's sort — a real button, separate from its cell so a non-sortable column can simply omit it |
| body | wraps the data rows |
| row | one data row — v1 has no per-row look (no selection, no pinning) |
| cell | one cell — content is the consumer's, same as every other kit part |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| caption | — | — | — |
| head | — | — | — |
| headRow | — | — | — |
| headerCell | ascending | [data-state="ascending"] | this column is the one currently sorted, low to high |
| headerCell | descending | [data-state="descending"] | this column is the one currently sorted, high to low |
| headerCell | none | [data-state="none"] | this column can sort, but isn't the one sorted right now |
| headerSortTrigger | ascending | [data-state="ascending"] | this column is the one currently sorted, low to high |
| headerSortTrigger | descending | [data-state="descending"] | this column is the one currently sorted, high to low |
| headerSortTrigger | none | [data-state="none"] | this column can sort, but isn't the one sorted right now |
| headerSortTrigger | disabled | :disabled | this column cannot sort — no button behavior, just the native disabled look |
| headerSortTrigger | hover | :hover | pointer is over this button |
| headerSortTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| headerSortTrigger | active | :active | this button is being held down |
| body | — | — | — |
| row | — | — | — |
| cell | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
