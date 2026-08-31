# Drawer

**Group:** overlays · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| positioner | anchors the drawer's content to the edge it slides from |
| content | the drawer's own panel |
| title | the drawer's own title |
| description | the drawer's own description |
| trigger | opens the drawer |
| backdrop | the dimmed overlay behind the drawer — fades along with the swipe gesture |
| grabber | the drag handle — a pointer-down here starts the swipe-to-dismiss gesture |
| grabberIndicator | the visible pull-bar inside the grabber — no graphic of its own, a skin draws the bar |
| closeTrigger | closes the drawer |
| swipeArea | an invisible, edge-anchored gesture zone that lets a closed drawer be swiped open |

## States

| part | state | mark | meaning |
|---|---|---|---|
| positioner | open | [data-state="open"] | the drawer is open |
| positioner | closed | [data-state="closed"] | the drawer is closed |
| positioner | up | [data-swipe-direction="up"] | the drawer slides in from, and dismisses toward, the top |
| positioner | down | [data-swipe-direction="down"] | the drawer slides in from, and dismisses toward, the bottom |
| positioner | left | [data-swipe-direction="left"] | the drawer slides in from, and dismisses toward, the left edge |
| positioner | right | [data-swipe-direction="right"] | the drawer slides in from, and dismisses toward, the right edge |
| content | open | [data-state="open"] | the drawer is open |
| content | closed | [data-state="closed"] | the drawer is closed |
| content | up | [data-swipe-direction="up"] | the drawer slides in from, and dismisses toward, the top |
| content | down | [data-swipe-direction="down"] | the drawer slides in from, and dismisses toward, the bottom |
| content | left | [data-swipe-direction="left"] | the drawer slides in from, and dismisses toward, the left edge |
| content | right | [data-swipe-direction="right"] | the drawer slides in from, and dismisses toward, the right edge |
| content | swiping | [data-swiping] | a drag or an opening swipe is in progress right now |
| content | dragging | [data-dragging] | a drag specifically is in progress (not the post-release settle) |
| content | expanded | [data-expanded] | the drawer is at its fully expanded snap point |
| content | nested-drawer-open | [data-nested-drawer-open] | a drawer stacked on top of this one is open |
| content | nested-drawer-swiping | [data-nested-drawer-swiping] | a drawer stacked on top of this one is being swiped |
| title | — | — | — |
| description | — | — | — |
| trigger | open | [data-state="open"] | the drawer is open |
| trigger | closed | [data-state="closed"] | the drawer is closed |
| trigger | current | [data-current] | in a multi-trigger drawer, this is the trigger that opened it |
| trigger | hover | :hover | pointer is over this button |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this button is being held down |
| backdrop | open | [data-state="open"] | the drawer is open |
| backdrop | closed | [data-state="closed"] | the drawer is closed |
| backdrop | swiping | [data-swiping] | a drag or an opening swipe is in progress right now |
| grabber | hover | :hover | pointer is over the grabber |
| grabber | active | :active | the grabber is being held down |
| grabberIndicator | — | — | — |
| closeTrigger | hover | :hover | pointer is over this button |
| closeTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| closeTrigger | active | :active | this button is being held down |
| swipeArea | open | [data-state="open"] | the drawer is open |
| swipeArea | closed | [data-state="closed"] | the drawer is closed |
| swipeArea | up | [data-swipe-direction="up"] | the drawer slides in from, and dismisses toward, the top |
| swipeArea | down | [data-swipe-direction="down"] | the drawer slides in from, and dismisses toward, the bottom |
| swipeArea | left | [data-swipe-direction="left"] | the drawer slides in from, and dismisses toward, the left edge |
| swipeArea | right | [data-swipe-direction="right"] | the drawer slides in from, and dismisses toward, the right edge |
| swipeArea | swiping | [data-swiping] | a drag or an opening swipe is in progress right now |
| swipeArea | disabled | [data-disabled] | swiping to open is disabled |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| content | `--drawer-translate` | kit | the current slide offset — the same value as `--drawer-translate-y` |
| content | `--drawer-translate-x` | kit | the current horizontal slide/drag offset |
| content | `--drawer-translate-y` | kit | the current vertical slide/drag offset |
| content | `--drawer-snap-point-offset-x` | kit | the horizontal offset of the active snap point |
| content | `--drawer-snap-point-offset-y` | kit | the vertical offset of the active snap point |
| content | `--drawer-swipe-movement-x` | kit | how far the current swipe gesture has moved horizontally |
| content | `--drawer-swipe-movement-y` | kit | how far the current swipe gesture has moved vertically |
| content | `--drawer-swipe-strength` | kit | how close the current swipe is to its dismiss threshold, as a fraction |
| content | `--nested-drawers` | kit | how many drawers are stacked on top of this one |
| content | `--drawer-height` | kit | the measured height of this drawer's content |
| content | `--drawer-frontmost-height` | kit | the measured height of the frontmost (topmost) drawer in the stack |
| backdrop | `--drawer-swipe-progress` | kit | how far open the current swipe gesture has made the drawer, as a fraction |
| backdrop | `--drawer-swipe-strength` | kit | how close the current swipe is to its dismiss threshold, as a fraction |

## Notes

<!-- user:start -->
## Overview

Drawer is a modal panel that slides in from an edge of the screen and can be dismissed by swipe,
drag, or the usual dialog controls — typically used for navigation or forms on touch devices. Ten
parts; like the dialog and popover, the root itself renders no DOM node.

## Features

- **The root is pure context** — same shape as `Dialog`/`Popover`: `trigger`/`backdrop`/
  `swipeArea` are real DOM siblings of `positioner`, not its ancestors or descendants. The
  passport's own `root` stands in as `positioner`.
- **`swipeDirection` picks the edge** — `"up"`/`"down"`/`"left"`/`"right"` (default `"down"`), or
  the logical `"start"`/`"end"`, resolved to a physical side per text direction; `content`/
  `positioner`/`swipeArea` all carry the resolved value as `data-swipe-direction`.
- **Snap points** — `snapPoints` (default `[1]`, fully open) defines intermediate open positions
  (e.g. `[0.25, 0.5, 1]`); `defaultSnapPoint`/`snapPoint` pick which one is active,
  `snapToSequentialPoints` restricts a swipe to moving one snap point at a time instead of jumping
  straight to the nearest.
- **Swipe-to-dismiss is tunable** — `closeThreshold` (default `0.25`, a fraction of the drawer's
  size) and `swipeVelocityThreshold` (default `700`px/s) both independently trigger a dismiss;
  crossing either closes the drawer.
- **Dragging isn't limited to the grabber by default** — `content`'s own `draggable` (default
  `true`) lets a drag start anywhere in the content; set it `false` to require the `grabber`.
  `data-no-drag` on any inner element opts that element out of starting a drag, regardless.
- **Nested drawers are tracked** — `content` picks up `nested-drawer-open`/`nested-drawer-swiping`
  when a drawer stacked on top of it is open or being swiped, plus a `--nested-drawers` count and a
  `--drawer-frontmost-height` variable — real hooks for dimming or scaling a parent drawer visually.
- **The richest CSS-variable surface in the kit** — eleven variables on `content` alone
  (translate/snap-offset/swipe-movement/swipe-strength/height, per axis where applicable), two more
  on `backdrop` (`--drawer-swipe-progress`, `--drawer-swipe-strength`, each written independently,
  not cascaded from the other).
- **`grabber` is real but keyboard-unreachable** — a genuine pointer-down-handled `<div>` (so
  `:hover`/`:active` apply), but it's never given a `tabIndex`, so it cannot receive keyboard focus
  or a `:focus-visible` state; dragging is a pointer-only gesture.
- **Multiple triggers, one drawer** — same device as the dialog: a `trigger`'s `value` distinguishes
  which one opened a shared drawer, and only that trigger carries `data-current`.

## Anatomy

```tsx
import {
  Drawer,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerPositioner,
  DrawerContent,
  DrawerGrabber,
  DrawerGrabberIndicator,
  DrawerTitle,
  DrawerDescription,
  DrawerCloseTrigger,
  DrawerSwipeArea,
} from "@omnifield/probe-web-ui";

<Drawer>
  <DrawerTrigger>{/* text or icon */}</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>{/* text */}</DrawerTitle>
      <DrawerDescription>{/* text */}</DrawerDescription>
      {/* any body content the consumer wants */}
      <DrawerCloseTrigger>{/* text or icon */}</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
  {/* lets a CLOSED drawer be swiped open from the edge */}
  <DrawerSwipeArea />
</Drawer>
```

## Examples

### Basic

```tsx
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <p>This is the content of the drawer.</p>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

### Sliding in from the side

```tsx
<Drawer swipeDirection="end">
  <DrawerTrigger>Open Right</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerTitle>Right Drawer</DrawerTitle>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

### Snap points, dragged by the grabber

```tsx
<Drawer snapPoints={[0.25, 0.5, 1]} defaultSnapPoint={0.5}>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>Drawer with Snap Points</DrawerTitle>
      <p>Drag the grabber to snap between different heights, or swipe to dismiss.</p>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

### Non-modal, with a swipe area to reopen it

```tsx
<Drawer modal={false}>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerPositioner>
    <DrawerContent>
      <DrawerTitle>Non-Modal Drawer</DrawerTitle>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
  <DrawerSwipeArea />
</Drawer>
```

### Disabling drag on part of the content

```tsx
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <p data-no-drag>This paragraph won't start a drag — useful over scrollable content.</p>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

## Styling hooks

Every mark in the tables above is a real selector (see `packages/skin`). `content`'s
`data-swipe-direction` is the main one worth styling by — Ark's own guidance rounds only the corner
facing the viewport, differently per direction. `content`'s eleven CSS variables drive its own
`transform` directly (`translate3d(var(--drawer-translate-x, 0px), var(--drawer-translate-y, 0px), 0)`);
a skin generally doesn't need to read most of them individually, but `--drawer-swipe-strength` (on
both `content` and `backdrop`) is useful for fading a "you're about to dismiss this" affordance in as
a swipe approaches its threshold.

## Accessibility

Drawer follows the WAI-ARIA [Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
same as the plain dialog.

| Key | What it does |
|---|---|
| `Enter` | When focus is on the trigger, opens the drawer |
| `Tab` | Moves focus to the next focusable element inside the drawer — focus is trapped there |
| `Shift + Tab` | Moves focus to the previous focusable element — same trap |
| `Esc` | Closes the drawer and moves focus to the trigger (or `finalFocusEl`, if set) |

The drag-to-dismiss gesture itself has no keyboard equivalent — `closeTrigger`/`Esc` are how a
keyboard user dismisses the drawer.
<!-- user:end -->
