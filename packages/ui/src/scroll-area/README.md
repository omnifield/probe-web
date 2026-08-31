# Scroll Area

**Group:** — · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole scroll area — sizes the visible window and measures the four variables its own scrollbar/thumb/corner read back |
| viewport | the clipping window — native overflow:auto, real scroll events |
| content | the scrollable content itself — sized to fit whatever the consumer puts inside it |
| scrollbar | one axis's own track |
| thumb | one axis's own drag handle |
| corner | the square where two scrollbars would otherwise overlap |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | overflow-x | [data-overflow-x] | content overflows horizontally — a horizontal scrollbar can exist |
| root | overflow-y | [data-overflow-y] | content overflows vertically — a vertical scrollbar can exist |
| viewport | overflow-x | [data-overflow-x] | content overflows horizontally — a horizontal scrollbar can exist |
| viewport | overflow-y | [data-overflow-y] | content overflows vertically — a vertical scrollbar can exist |
| viewport | at-top | [data-at-top] | scrolled all the way to the top |
| viewport | at-bottom | [data-at-bottom] | scrolled all the way to the bottom |
| viewport | at-left | [data-at-left] | scrolled all the way to the left |
| viewport | at-right | [data-at-right] | scrolled all the way to the right |
| content | overflow-x | [data-overflow-x] | content overflows horizontally — a horizontal scrollbar can exist |
| content | overflow-y | [data-overflow-y] | content overflows vertically — a vertical scrollbar can exist |
| scrollbar | vertical | [data-orientation="vertical"] | this node is the vertical instance — scroll-area renders one of these per axis |
| scrollbar | horizontal | [data-orientation="horizontal"] | this node is the horizontal instance — scroll-area renders one of these per axis |
| scrollbar | overflow-x | [data-overflow-x] | content overflows horizontally — a horizontal scrollbar can exist |
| scrollbar | overflow-y | [data-overflow-y] | content overflows vertically — a vertical scrollbar can exist |
| scrollbar | hover | [data-hover] | the pointer is anywhere near the scroll area's own scrollbar affordances right now |
| scrollbar | dragging | [data-dragging] | a thumb is currently being dragged |
| scrollbar | scrolling | [data-scrolling] | a scroll is actively happening on this axis right now |
| thumb | vertical | [data-orientation="vertical"] | this node is the vertical instance — scroll-area renders one of these per axis |
| thumb | horizontal | [data-orientation="horizontal"] | this node is the horizontal instance — scroll-area renders one of these per axis |
| thumb | hover | [data-hover] | the pointer is anywhere near the scroll area's own scrollbar affordances right now |
| thumb | dragging | [data-dragging] | a thumb is currently being dragged |
| corner | overflow-x | [data-overflow-x] | content overflows horizontally — a horizontal scrollbar can exist |
| corner | overflow-y | [data-overflow-y] | content overflows vertically — a vertical scrollbar can exist |
| corner | hover | [data-hover] | the pointer is anywhere near the scroll area's own scrollbar affordances right now |
| corner | hidden | [data-state="hidden"] | hidden by the skin — only one axis scrolls, nothing to fill |
| corner | visible | [data-state="visible"] | shown by the skin — both axes scroll, the corner square is needed |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| root | `--corner-width` | kit | measured width of the corner square |
| root | `--corner-height` | kit | measured height of the corner square |
| root | `--thumb-width` | kit | measured width of the vertical thumb |
| root | `--thumb-height` | kit | measured height of the horizontal thumb |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
