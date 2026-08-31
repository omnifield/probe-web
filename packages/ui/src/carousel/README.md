# Carousel

**Group:** — · **Genus:** component · **Footprint:** wide

## Anatomy

| part | meaning |
|---|---|
| root | the whole carousel — viewport, navigation, and indicators together |
| itemGroup | the scrollable viewport that holds every slide |
| item | one slide |
| control | wraps the previous/next navigation buttons and, when present, the autoplay toggle |
| prevTrigger | scrolls back one page |
| nextTrigger | scrolls forward one page |
| indicatorGroup | wraps one indicator per slide (or per page, when slidesPerPage is more than one) |
| indicator | one dot — jumps straight to its slide when clicked |
| autoplayTrigger | starts or pauses automatic scrolling |
| progressText | page count text |
| autoplayIndicator | the autoplay button's own icon — swaps between children (running) and fallback (paused); always mounted, only the content changes |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| itemGroup | dragging | [data-dragging] | the viewport is being dragged by the pointer (only when allowMouseDrag is on) |
| item | inview | [data-inview] | this slide is currently visible in the viewport (crosses inViewThreshold) |
| control | — | — | — |
| prevTrigger | disabled | :disabled | already at the first page and the carousel does not loop — nothing to scroll back to |
| prevTrigger | hover | :hover | pointer is over this button |
| prevTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| prevTrigger | active | :active | this button is being held down |
| nextTrigger | disabled | :disabled | already at the last page and the carousel does not loop — nothing to scroll forward to |
| nextTrigger | hover | :hover | pointer is over this button |
| nextTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| nextTrigger | active | :active | this button is being held down |
| indicatorGroup | — | — | — |
| indicator | current | [data-current] | this dot's slide is the one currently showing |
| indicator | readonly | [data-readonly] | clicking does nothing — the indicator was set read-only |
| indicator | hover | :hover | pointer is over this button |
| indicator | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| indicator | active | :active | this button is being held down |
| autoplayTrigger | pressed | [data-pressed] | autoplay is running — this toggle is in its "on" state |
| autoplayTrigger | hover | :hover | pointer is over this button |
| autoplayTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| autoplayTrigger | active | :active | this button is being held down |
| progressText | — | — | — |
| autoplayIndicator | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which axis the slides scroll on — also flips which way prevTrigger/nextTrigger point | `horizontal` | [data-orientation] |

## Notes

<!-- user:start -->
## Overview

Carousel is a scrollable slideshow — one slide in view at a time by default (or several, via
`slidesPerPage`), advanced by trigger buttons, drag, wheel, indicator dots, or autoplay. Eleven
parts, the widest footprint in the kit.

## Features

- **`slideCount` is required** — the carousel needs the total up front (useful for SSR, since it
  computes snap points before any slide has actually measured itself).
- **Controlled or uncontrolled page** — `page` + `onPageChange` for controlled use, `defaultPage`
  for uncontrolled.
- **Horizontal or vertical** — `orientation` (the kit's one real setting for this component) flips
  which axis slides move on and which way `prevTrigger`/`nextTrigger` point.
- **Multiple slides per page** — `slidesPerPage` shows more than one slide at once;
  `slidesPerMove` (default `"auto"`, following `slidesPerPage`) controls how many advance per click.
- **Variable-width slides** — `autoSize` lets each `item` size itself instead of the kit computing a
  uniform width; `snapAlign` (`"start"` default, or `"center"`/`"end"`) controls where an item snaps
  into view.
- **Looping** — `loop` lets `prevTrigger`/`nextTrigger` wrap around instead of disabling at the
  ends.
- **Autoplay** — `autoplay` (`true`, or `{ delay }` for a custom interval) advances automatically;
  pairs with `loop` so it doesn't just stop dead at the last slide.
- **Mouse drag is opt-in** — `allowMouseDrag` (default `false`) is required for `itemGroup`'s own
  `dragging` state to ever apply; touch/trackpad scrolling works regardless.
- **`item`'s `inview` state is threshold-based** — `inViewThreshold` (default `0.6`) sets how much
  of a slide must be visible before it's marked `data-inview`.
- **Read-only indicators** — `indicator`'s `readOnly` stops it from jumping to its slide on click
  while still showing which slide is current.
- **Two parts fill in default content** — `progressText` renders `"<page> / <total>"` when given no
  children; `autoplayIndicator` always stays mounted and switches between `children` (while
  playing) and its own `fallback` prop (while paused) — neither is a plain pass-through part the
  way most kit parts are.
- **Pause-on-hover isn't built in** — Ark's own docs implement it via the `Context` render prop's
  `play()`/`pause()` methods on `itemGroup`'s pointer events, not a prop; there's no
  `pauseOnHover` setting to reach for.

## Anatomy

```tsx
import {
  Carousel,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselItemGroup,
  CarouselItem,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselAutoplayTrigger,
  CarouselAutoplayIndicator,
  CarouselProgressText,
} from "@omnifield/probe-web-ui";

<Carousel slideCount={items.length}>
  <CarouselControl>
    <CarouselPrevTrigger>{/* text or icon */}</CarouselPrevTrigger>
    <CarouselAutoplayTrigger>
      <CarouselAutoplayIndicator fallback={/* paused icon */}>
        {/* playing icon */}
      </CarouselAutoplayIndicator>
    </CarouselAutoplayTrigger>
    <CarouselNextTrigger>{/* text or icon */}</CarouselNextTrigger>
    <CarouselProgressText />
  </CarouselControl>
  <CarouselItemGroup>
    {/* one CarouselItem per slide; `index` is required */}
    <CarouselItem index={0}>{/* slide content */}</CarouselItem>
  </CarouselItemGroup>
  <CarouselIndicatorGroup>
    {/* one CarouselIndicator per slide (or per page); `index` is required */}
    <CarouselIndicator index={0} />
  </CarouselIndicatorGroup>
</Carousel>
```

## Examples

### Basic

```tsx
<Carousel slideCount={items.length}>
  <CarouselControl>
    <CarouselPrevTrigger>‹</CarouselPrevTrigger>
    <CarouselNextTrigger>›</CarouselNextTrigger>
  </CarouselControl>
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
  <CarouselIndicatorGroup>
    <For each={items}>{(_item, index) => <CarouselIndicator index={index()} />}</For>
  </CarouselIndicatorGroup>
</Carousel>
```

### Autoplay, with a play/pause toggle

`loop` keeps autoplay from stopping dead at the last slide:

```tsx
<Carousel slideCount={items.length} autoplay loop>
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
  <CarouselControl>
    <CarouselPrevTrigger>‹</CarouselPrevTrigger>
    <CarouselAutoplayTrigger>
      <CarouselAutoplayIndicator fallback="▶">⏸</CarouselAutoplayIndicator>
    </CarouselAutoplayTrigger>
    <CarouselNextTrigger>›</CarouselNextTrigger>
  </CarouselControl>
</Carousel>
```

### Several slides per page, with spacing

```tsx
<Carousel slideCount={items.length} slidesPerPage={2} spacing="20px">
  <CarouselControl>
    <CarouselPrevTrigger>‹</CarouselPrevTrigger>
    <CarouselNextTrigger>›</CarouselNextTrigger>
  </CarouselControl>
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
</Carousel>
```

### Vertical

```tsx
<Carousel slideCount={items.length} orientation="vertical">
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
  <CarouselControl>
    <CarouselPrevTrigger>↑</CarouselPrevTrigger>
    <CarouselNextTrigger>↓</CarouselNextTrigger>
  </CarouselControl>
</Carousel>
```

### Controlled

```tsx
import { createSignal } from "solid-js";

const [page, setPage] = createSignal(0);

<Carousel slideCount={items.length} page={page()} onPageChange={(details) => setPage(details.page)}>
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
  <CarouselControl>
    <CarouselPrevTrigger>‹</CarouselPrevTrigger>
    <CarouselNextTrigger>›</CarouselNextTrigger>
  </CarouselControl>
</Carousel>
```

## Styling hooks

`orientation` is the one setting-level mark (`[data-orientation]`, also present on most parts
themselves per Ark's own data-attribute table); everything else in the States table above is a
per-part state a skin can select on directly. Worth knowing before styling `item`: `snapAlign` and
`autoSize` are layout, not lookable states — there's no mark for "this item is centered," only
`data-inview` for whether it crosses the visibility threshold. `indicator`'s `current`/`readonly`
are independent — a read-only indicator can still be the current one.

## Accessibility

Carousel follows the WAI-ARIA [Carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
Ark's own documentation gives no dedicated keyboard table for it (unlike, say, the accordion) —
navigation goes through the ordinary button controls: `Tab`/`Shift+Tab` move focus between
`prevTrigger`/`nextTrigger`/`indicator`/`autoplayTrigger`, and `Space`/`Enter` activate whichever one
has focus, the same plain [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) every
button-shaped part in this kit follows.
<!-- user:end -->
