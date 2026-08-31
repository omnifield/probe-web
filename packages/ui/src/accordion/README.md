# Accordion

**Group:** disclosure · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole set of items — one node wrapping every item |
| item | one item — a trigger together with its content |
| itemTrigger | the item's button — expands and collapses it |
| itemContent | the item's content — the area that gets expanded |
| itemIndicator | the expansion indicator — an arrow placed by the consumer |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| item | open | [data-state="open"] | the item is expanded — its content is visible |
| item | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| item | focus | [data-focus] | focus is on this item's trigger |
| itemTrigger | open | [data-state="open"] | the item is expanded — its content is visible |
| itemTrigger | focus | [data-focus] | focus is on this item's trigger |
| itemTrigger | disabled | :disabled | the button is disabled — clicking it does not expand the item |
| itemTrigger | hover | :hover | pointer is over the button |
| itemTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemTrigger | active | :active | the button is being held down |
| itemContent | open | [data-state="open"] · may be absent | the item is expanded — its content is visible |
| itemContent | closed | [data-state="closed"] | the item is collapsed — its content is hidden, but the node stays in place |
| itemContent | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| itemContent | focus | [data-focus] | focus is on this item's trigger |
| itemIndicator | open | [data-state="open"] | the item is expanded — its content is visible |
| itemIndicator | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| itemIndicator | focus | [data-focus] | focus is on this item's trigger |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria | `vertical` | [data-orientation] |
| multiple | whether several items can stay expanded at once | `false` | — |
| collapsible | whether the last expanded item can be closed, leaving the whole accordion collapsed | `false` (depends on `multiple`) | — |

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| itemContent | `--height` | kit | the measured height of the expanded content |
| itemContent | `--width` | kit | the measured width of the expanded content — needed by a horizontal accordion |

## Notes

<!-- user:start -->
## Overview

Accordion is a set of collapsible items — sections that share one column (or, in `horizontal`
orientation, one row) and show or hide their content when their own trigger is clicked. It's a
disclosure component: each item is independently expandable, and how many can stay open at once is
a setting, not a fixed rule. It was the first composite component the kit took from Ark UI
(`PWEB-37`) — several DOM nodes sharing one skin coordinate, so dressing the item dresses every one
of its parts at once.

## Features

- **Independent expand/collapse per item** — each `item` tracks its own `open` state; clicking its
  `itemTrigger` toggles it.
- **Single- or multi-open** — `multiple` (default `false`) controls whether more than one item can
  stay expanded at the same time.
- **Collapsible single-open mode** — `collapsible` (default `false`) lets the one open item, in
  single-open mode, be closed too, leaving nothing expanded. It has no extra effect once `multiple`
  is on, since closing the last open item is already possible there.
- **Vertical or horizontal layout** — `orientation` (default `vertical`) switches the keyboard
  navigation axis and the ARIA orientation together; `horizontal` also switches which measured
  dimension matters for animating content (`--width` instead of `--height`, see Styling hooks).
- **Per-item disabling** — an `item` can be disabled, which disables its trigger (native
  `:disabled`) and marks the item/content/indicator with `data-disabled`.
- **Controlled or uncontrolled expansion** — `value` / `defaultValue` / `onValueChange` on the root,
  same shape either way: an array of the expanded items' `value`s.
- **Content stays mounted while collapsed** — a closed `itemContent` keeps its DOM node (`hidden`
  plus `data-state="closed"`), so it can still be measured and animated (see below), unlike content
  that's been removed from the tree.

## Anatomy

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
  AccordionItemIndicator,
} from "@omnifield/probe-web-ui";

<Accordion>
  <AccordionItem value="...">
    {/* Ark has no "header" part — WAI-ARIA wants the trigger inside a heading whose
        level only the page knows, so the consumer supplies it. */}
    <SomeHeadingLevel>
      <AccordionItemTrigger>
        {/* text and/or icon content */}
        <AccordionItemIndicator>{/* icon */}</AccordionItemIndicator>
      </AccordionItemTrigger>
    </SomeHeadingLevel>
    <AccordionItemContent>{/* text, or any other component */}</AccordionItemContent>
  </AccordionItem>
  {/* repeat AccordionItem for each section */}
</Accordion>
```

`AccordionItem`'s `value` is required and must be unique among siblings — it's what `value` /
`defaultValue` on the root, and every `on:click` callback, identify the item by.

## Examples

### Several items open at once

`multiple` lifts the "only one open" rule; any number of items can be expanded together.

```tsx
<Accordion multiple defaultValue={["shipping", "returns"]}>
  <AccordionItem value="shipping">
    <h3>
      <AccordionItemTrigger>
        Shipping
        <AccordionItemIndicator>▾</AccordionItemIndicator>
      </AccordionItemTrigger>
    </h3>
    <AccordionItemContent>Courier and pickup.</AccordionItemContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <h3>
      <AccordionItemTrigger>
        Returns
        <AccordionItemIndicator>▾</AccordionItemIndicator>
      </AccordionItemTrigger>
    </h3>
    <AccordionItemContent>30-day window, no restocking fee.</AccordionItemContent>
  </AccordionItem>
</Accordion>
```

### Single-open, and letting it fully collapse

Without `multiple`, opening an item closes whichever one was open before it — but the last item
open can't be closed by clicking its own trigger again, unless `collapsible` says it can:

```tsx
<Accordion collapsible defaultValue={["shipping"]}>
  <AccordionItem value="shipping">
    <h3>
      <AccordionItemTrigger>
        Shipping
        <AccordionItemIndicator>▾</AccordionItemIndicator>
      </AccordionItemTrigger>
    </h3>
    <AccordionItemContent>Courier and pickup.</AccordionItemContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <h3>
      <AccordionItemTrigger>
        Returns
        <AccordionItemIndicator>▾</AccordionItemIndicator>
      </AccordionItemTrigger>
    </h3>
    <AccordionItemContent>30-day window, no restocking fee.</AccordionItemContent>
  </AccordionItem>
</Accordion>
```

### Horizontal orientation

`orientation="horizontal"` turns the keyboard axis sideways (`ArrowLeft`/`ArrowRight` replace
`ArrowUp`/`ArrowDown`) and switches the measured dimension a skin would animate from `--height` to
`--width`, since it's now the expanding content's width that changes, not its height:

```tsx
<Accordion orientation="horizontal" defaultValue={["shipping"]}>
  <AccordionItem value="shipping">
    <h3>
      <AccordionItemTrigger>Shipping</AccordionItemTrigger>
    </h3>
    <AccordionItemContent>Courier and pickup.</AccordionItemContent>
  </AccordionItem>
  <AccordionItem value="returns">
    <h3>
      <AccordionItemTrigger>Returns</AccordionItemTrigger>
    </h3>
    <AccordionItemContent>30-day window, no restocking fee.</AccordionItemContent>
  </AccordionItem>
</Accordion>
```

### A disabled item

`disabled` on `AccordionItem` stops that one item from expanding — its trigger can't be clicked or
focused via keyboard navigation:

```tsx
<Accordion defaultValue={["shipping"]}>
  <AccordionItem value="shipping" disabled>
    <h3>
      <AccordionItemTrigger>
        Shipping (temporarily unavailable)
        <AccordionItemIndicator>▾</AccordionItemIndicator>
      </AccordionItemTrigger>
    </h3>
    <AccordionItemContent>Courier and pickup.</AccordionItemContent>
  </AccordionItem>
</Accordion>
```

### Composing a real component inside the content

`itemContent` accepts arbitrary content, including another independently-addressed component, not
just text — `playground/assemblies/action-list.ts` is a worked `RenderTree` example of this: each
item's content nests a real `Listbox` pulled from the shared registry rather than a copy of one.
`playground/assemblies/base.ts` is the plainer sibling example, with plain content per item.  These
are secondary references for realistic data shapes; most consumers should reach for the plain JSX
composition shown throughout this page, not the tree format.

## Styling hooks

Every state/setting carrying a mark in the tables above is a real selector a skin can hook into
(e.g. `[data-scope="accordion"][data-part="item"][data-state="open"]`, see `packages/skin`) — with
two things worth knowing before relying on one. First, `itemContent`'s `open` mark can be **absent**:
an item that starts expanded with no animation never gets `data-state` written to it at all, so a
skin shouldn't require the mark's presence to render the expanded look. Second, `itemTrigger`'s
`disabled`/`hover`/`focus-visible`/`active` states are native pseudo-classes (`:disabled`, `:hover`,
`:focus-visible`, `:active`), not `data-*` attributes — Zag disables and tracks the real `<button>`
directly — while every other part's equivalent states arrive as `data-*` attributes instead.

## Accessibility

Accordion follows the WAI-ARIA [Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

| Key | What it does |
|---|---|
| `Space` / `Enter` | When focus is on a collapsed item's trigger, expands that item |
| `Tab` | Moves focus to the next focusable element |
| `Shift + Tab` | Moves focus to the previous focusable element |
| `ArrowDown` / `ArrowUp` (`vertical`) | Moves focus to the next / previous trigger |
| `ArrowRight` / `ArrowLeft` (`horizontal`) | Moves focus to the next / previous trigger |
| `Home` | Moves focus to the first trigger |
| `End` | Moves focus to the last trigger |
<!-- user:end -->
