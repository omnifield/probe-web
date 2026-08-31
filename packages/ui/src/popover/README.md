# Popover

**Group:** overlays · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| arrow | the outer clipping box for the pointing arrow |
| arrowTip | the arrow's actual point — rotated into a diamond by the kit's own positioning |
| anchor | an optional reference point the popover positions against, instead of the trigger |
| trigger | opens and closes the popover |
| indicator | open/closed glyph — the consumer places the actual icon |
| positioner | positions the floating content relative to the trigger (or the anchor) — a pure wrapper, no look of its own |
| content | the floating panel itself — hidden, not removed, while closed |
| title | the panel's own heading |
| description | the panel's own body text |
| closeTrigger | closes the popover |

## States

| part | state | mark | meaning |
|---|---|---|---|
| arrow | — | — | — |
| arrowTip | — | — | — |
| anchor | — | — | — |
| trigger | open | [data-state="open"] | the popover panel is showing |
| trigger | closed | [data-state="closed"] | the popover panel is hidden |
| trigger | current | [data-current] | this is the trigger that opened the popover (multi-trigger popovers only) |
| trigger | hover | :hover | pointer is over this button |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this button is being held down |
| indicator | open | [data-state="open"] | the popover panel is showing |
| indicator | closed | [data-state="closed"] | the popover panel is hidden |
| positioner | — | — | — |
| content | open | [data-state="open"] | the popover panel is showing |
| content | closed | [data-state="closed"] | the popover panel is hidden |
| title | — | — | — |
| description | — | — | — |
| closeTrigger | hover | :hover | pointer is over this button |
| closeTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| closeTrigger | active | :active | this button is being held down |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| positioner | `--reference-width` | kit | measured width of the trigger (or anchor) the panel is positioned against |
| positioner | `--reference-height` | kit | measured height of the trigger (or anchor) the panel is positioned against |
| positioner | `--available-width` | kit | space left before the panel would hit the viewport edge |
| positioner | `--available-height` | kit | space left before the panel would hit the viewport edge |

## Notes

<!-- user:start -->
## Overview

Popover is a floating panel anchored to a trigger, with its own title, description, and close
button — a lighter-weight, non-modal-by-default sibling of the dialog. Ten parts; the root itself
renders no DOM node.

## Features

- **The root is pure context** — same shape as `Dialog`/`Drawer`/`Menu`: `trigger`/`anchor`/
  `positioner` are its real DOM siblings, not children.
- **An optional separate anchor point** — `anchor` positions the panel against a different element
  than the one that opens it (e.g. an input next to the trigger button), instead of the trigger's
  own position.
- **Controlled or uncontrolled open state** — `open` + `onOpenChange` for controlled use,
  `defaultOpen` for uncontrolled.
- **Not modal by default, unlike the dialog** — `modal` (default `false`) opts into trapping focus,
  blocking scroll, disabling outside interaction, and hiding page content from assistive tech; a
  plain popover allows interacting with the rest of the page while open.
- **Configurable dismissal** — `closeOnEscape`/`closeOnInteractOutside` (both default `true`) can be
  turned off independently, same as the dialog.
- **Focus is managed, not left to the browser** — `autoFocus` (default `true`) focuses the first
  focusable element in content on open; `initialFocusEl`/`finalFocusEl` override which element
  receives focus on open/close, `restoreFocus` (default `true`) returns it to the trigger.
- **Multiple triggers, one popover** — same device as the dialog: a `trigger`'s `value`
  distinguishes which one opened a shared popover, and only that trigger carries `data-current`;
  the popover repositions to whichever trigger was activated, without closing.
- **Nestable** — a `Popover` can be composed inside another popover's `content`; each maintains its
  own independent open state and positioning.
- **`--available-width`/`--available-height` are for capping size, not just informational** — Ark's
  own guidance uses them directly in a `max-height`/`max-width` rule so the panel never grows past
  the viewport edge.
- **This kit doesn't re-export a `Portal` component** — Ark's own docs wrap every `Positioner` in
  `<Portal>`, and `portalled` (a real root prop, default `true`) exists specifically to keep tabbing
  behavior correct regardless of where content actually renders in the DOM — but this kit provides
  no `Portal` wrapper of its own to pair it with; content renders in normal document flow here.

## Anatomy

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverPositioner,
  PopoverContent,
  PopoverArrow,
  PopoverArrowTip,
  PopoverTitle,
  PopoverDescription,
  PopoverCloseTrigger,
} from "@omnifield/probe-web-ui";

<Popover>
  <PopoverTrigger>{/* text or icon */}</PopoverTrigger>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverArrow>
        <PopoverArrowTip />
      </PopoverArrow>
      <PopoverTitle>{/* text */}</PopoverTitle>
      <PopoverDescription>{/* text */}</PopoverDescription>
      <PopoverCloseTrigger>{/* text or icon */}</PopoverCloseTrigger>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

## Examples

### Basic

```tsx
<Popover>
  <PopoverTrigger>Click Me</PopoverTrigger>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverTitle>Favorite Frameworks</PopoverTitle>
      <PopoverDescription>Manage and organize your favorite web frameworks.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

### With an arrow and close button

```tsx
<Popover>
  <PopoverTrigger>Click Me</PopoverTrigger>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverArrow>
        <PopoverArrowTip />
      </PopoverArrow>
      <PopoverCloseTrigger>✕</PopoverCloseTrigger>
      <PopoverTitle>Notifications</PopoverTitle>
      <PopoverDescription>You have 3 unread messages.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

### Modal, trapping focus

```tsx
<Popover modal>
  <PopoverTrigger>Click Me</PopoverTrigger>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverCloseTrigger>✕</PopoverCloseTrigger>
      <PopoverTitle>Confirm Action</PopoverTitle>
      <PopoverDescription>Focus is trapped inside until dismissed.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

### Anchored to a different element than the trigger

```tsx
import { PopoverAnchor } from "@omnifield/probe-web-ui";

<Popover>
  <div>
    <PopoverTrigger>Click Me</PopoverTrigger>
    <PopoverAnchor>
      <input placeholder="Type here..." />
    </PopoverAnchor>
  </div>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverTitle>Title</PopoverTitle>
      <PopoverDescription>Positioned against the input, not the button.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

### Capping content size to the viewport

```tsx
<PopoverPositioner>
  <PopoverContent style={{ "max-height": "calc(var(--available-height) - 100px)" }}>
    {/* long content */}
  </PopoverContent>
</PopoverPositioner>
```

## Styling hooks

`trigger`/`indicator`/`content` all carry the open/closed pair (see `packages/skin`); `trigger`
additionally carries `data-current` in a multi-trigger popover. `positioner`'s four CSS variables
(`--reference-width`/`-height`, `--available-width`/`-height`) are the same floating-panel-sizing
mechanism the select's/date-picker's/menu's own positioner exposes — `--available-height` in
particular is meant to be read directly in a `max-height` rule, not just observed. `content` also
picks up `data-nested`/`data-has-nested` when popovers stack, the same device the dialog's own
nesting uses.

## Accessibility

Popover follows a floating-panel-with-focus-management pattern, same family as the dialog.

| Key | What it does |
|---|---|
| `Space` / `Enter` | Opens or closes the popover, when focus is on the trigger |
| `Tab` | Moves focus to the next focusable element inside content; past the last one, or if content has none, focus moves on past the trigger |
| `Shift + Tab` | Moves focus to the previous focusable element inside content, or back to the trigger if content has none |
| `Esc` | Closes the popover and moves focus to the trigger |
<!-- user:end -->
