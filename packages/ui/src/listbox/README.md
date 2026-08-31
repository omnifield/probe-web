# Listbox

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the listbox as a whole — label, filter input, and the item list together |
| label | the listbox's own label |
| input | optional filter/search text field — narrows which items show |
| content | wraps the items — the scrollable/navigable region, always in the document |
| item | one selectable option |
| itemText | an item's visible label |
| itemIndicator | selected-item indicator — a checkmark placed by the consumer |
| itemGroup | groups related items under one label |
| itemGroupLabel | label of an item group |
| valueText | shows the selected value(s) as a comma-separated string, or the placeholder |
| empty | shown only while the collection is empty |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | disabled | [data-disabled] | the whole listbox is disabled |
| label | disabled | [data-disabled] | the whole listbox is disabled |
| input | disabled | [data-disabled] | the whole listbox is disabled |
| content | empty | [data-empty] | there are no items to show |
| item | checked | [data-state="checked"] | this item is selected |
| item | unchecked | [data-state="unchecked"] | this item is not selected |
| item | highlighted | [data-highlighted] | keyboard or pointer moved to this item, not yet chosen |
| item | disabled | [data-disabled] | the whole listbox is disabled |
| itemText | checked | [data-state="checked"] | this item is selected |
| itemText | unchecked | [data-state="unchecked"] | this item is not selected |
| itemText | highlighted | [data-highlighted] | keyboard or pointer moved to this item, not yet chosen |
| itemText | disabled | [data-disabled] | the whole listbox is disabled |
| itemIndicator | checked | [data-state="checked"] | this item is selected |
| itemIndicator | unchecked | [data-state="unchecked"] | this item is not selected |
| itemGroup | disabled | [data-disabled] | the whole listbox is disabled |
| itemGroup | empty | [data-empty] | this group has no items |
| itemGroupLabel | — | — | — |
| valueText | disabled | [data-disabled] | the whole listbox is disabled |
| empty | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | which axis items are laid out on and navigated with the keyboard | `vertical` | [data-orientation] |

## Notes

<!-- user:start -->
## Overview

Listbox is a selectable list of options, single or multiple, over a data-driven item collection —
the select's nearest sibling in the kit, sharing the same collection/item/itemText/itemIndicator/
itemGroup shape, but with no floating layer of its own: every part stays in the document all the
time, there's no trigger to open or close, no `data-state="open"|"closed"` anywhere in its anatomy.

## Features

- **Takes plain `items`, not a live collection** — unlike Ark's own `Root`, which requires a real
  `ListCollection` instance, this kit's `Listbox` takes `items` (plain data, the exact shape an
  assembly can `bind` to a JSON path) and builds the collection internally, memoized so identity
  stays stable across unrelated re-renders.
- **Three selection modes** — `selectionMode`: `"single"` (default), `"multiple"` (click toggles,
  no modifier needed), or `"extended"` (multi-select via `Cmd`/`Ctrl`, the file-manager-style
  interaction).
- **Grouped or flat items** — `content` accepts `itemGroup`s (each with its own `itemGroupLabel`)
  or plain `item`s directly, or a mix; grouping is purely presentational, selection works the same
  either way.
- **Horizontal or vertical** — `orientation` (the kit's one real setting for this component) flips
  the layout axis and which arrow keys navigate it.
- **A real, addressed filter input** — `input` isn't part of Ark's own basic example, but it's a
  real anatomy part meant for the filtering scenario: pair it with `useListCollection`'s `filter`
  function (from `@ark-ui/solid/collection`) to narrow `collection.items` as the consumer types.
  `keyboardPriority` controls whether the input's own text-editing keys or listbox navigation wins
  on a conflict.
- **`empty` mounts only when there's nothing to show** — Ark itself gates it
  (`<Show when={collection.size === 0}>`); the kit adds no second gate, useful together with a
  filter input that can narrow the list to zero matches.
- **Highlight is tracked independently of selection** — `highlightedValue`/`onHighlightChange`
  (controlled) or `defaultHighlightedValue` track which item has keyboard/pointer focus, separate
  from which is actually `checked`; `item`'s own `highlightOnHover` opts a mounted item into
  highlighting on hover, not just keyboard movement.
- **`itemIndicator` is hidden, not removed, while unchecked** — same device as the select's own
  item indicator: the consumer places the checkmark, the kit hides the node via native `hidden`
  rather than unmounting it.
- **Empty selection can be disallowed** — `deselectable` (when `false`) keeps at least one item
  selected at all times, refusing to let the last selection be cleared.

## Anatomy

```tsx
import {
  Listbox,
  ListboxLabel,
  ListboxInput,
  ListboxContent,
  ListboxItemGroup,
  ListboxItemGroupLabel,
  ListboxItem,
  ListboxItemText,
  ListboxItemIndicator,
  ListboxValueText,
  ListboxEmpty,
} from "@omnifield/probe-web-ui";

<Listbox items={[{ value: "us", label: "United States" }]}>
  <ListboxLabel>{/* text */}</ListboxLabel>
  <ListboxInput />
  <ListboxContent>
    {/* either itemGroup(s), or item(s) directly */}
    <ListboxItemGroup>
      <ListboxItemGroupLabel>{/* text */}</ListboxItemGroupLabel>
      <ListboxItem item={{ value: "us", label: "United States" }}>
        <ListboxItemText>{/* text */}</ListboxItemText>
        <ListboxItemIndicator>{/* icon */}</ListboxItemIndicator>
      </ListboxItem>
    </ListboxItemGroup>
    <ListboxEmpty>{/* text, shown only when there's nothing to show */}</ListboxEmpty>
  </ListboxContent>
  <ListboxValueText placeholder="Nothing selected" />
</Listbox>
```

## Examples

### Basic, single selection

```tsx
<Listbox items={countries}>
  <ListboxLabel>Select Country</ListboxLabel>
  <ListboxContent>
    <For each={countries}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
          <ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      )}
    </For>
  </ListboxContent>
</Listbox>
```

### Multiple selection

```tsx
<Listbox items={days} selectionMode="multiple">
  <ListboxLabel>Select Days</ListboxLabel>
  <ListboxContent>
    <For each={days}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
          <ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      )}
    </For>
  </ListboxContent>
</Listbox>
```

### Grouped items

```tsx
<Listbox items={cities}>
  <ListboxLabel>Select City</ListboxLabel>
  <ListboxContent>
    <For each={groupedByRegion}>
      {([region, items]) => (
        <ListboxItemGroup>
          <ListboxItemGroupLabel>{region}</ListboxItemGroupLabel>
          <For each={items}>
            {(item) => (
              <ListboxItem item={item}>
                <ListboxItemText>{item.label}</ListboxItemText>
              </ListboxItem>
            )}
          </For>
        </ListboxItemGroup>
      )}
    </For>
  </ListboxContent>
</Listbox>
```

### Filterable

```tsx
import { useListCollection } from "@ark-ui/solid/collection";

const { collection, filter } = useListCollection({
  initialItems: frameworks,
  filter: (itemText, filterText) => itemText.toLowerCase().includes(filterText.toLowerCase()),
});

<Listbox items={collection().items}>
  <ListboxLabel>Select Framework</ListboxLabel>
  <ListboxInput placeholder="Search…" onInput={(event) => filter(event.currentTarget.value)} />
  <ListboxContent>
    <For each={collection().items}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
        </ListboxItem>
      )}
    </For>
    <ListboxEmpty>No frameworks found</ListboxEmpty>
  </ListboxContent>
</Listbox>
```

### Showing the selection as text

```tsx
<Listbox items={colors} selectionMode="multiple" defaultValue={["red", "blue"]}>
  <ListboxLabel>
    Colors: <ListboxValueText />
  </ListboxLabel>
  <ListboxContent>
    <For each={colors}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
          <ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      )}
    </For>
  </ListboxContent>
</Listbox>
```

## Styling hooks

`item`/`itemText`/`itemIndicator` all share `checked`/`unchecked`/`highlighted`/`disabled` (see
`packages/skin`) — highlighted and checked are independent: an item can be highlighted (keyboard
focus) without being checked, or checked without currently being highlighted. `content`/`itemGroup`
both carry `empty` for when there's nothing to render. Unlike the select, nothing here ever carries
an open/closed pair — there's no floating layer to open.

## Accessibility

Listbox follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).
Ark's own documentation doesn't publish an explicit keyboard table for it, but real, grounded
behavior includes: arrow-key navigation along the `orientation` axis moves the highlight,
`Space`/`Enter` selects the highlighted item, `typeahead` (opt-in) jumps to an item by typing its
text, and — unless `disallowSelectAll` is set — `Cmd`/`Ctrl`+`A` selects every item at once in
`multiple`/`extended` mode. `loopFocus` controls whether navigating past the last item wraps back
to the first.

## Assembly & skin notes

Concrete things that cost real time to find on this component's nearest sibling (`select`) —
listed here because the same traps apply to `listbox` for the same reasons, even though none of
them has actually bitten this component yet.

- **No `selfAssembly`.** A bare `{ node: "listbox" }` reference from elsewhere gets you the root
  and nothing else — the whole compound tree (`content`/`item`/`itemText`/`itemIndicator`, plus
  `itemGroup`/`itemGroupLabel` if needed) has to be authored by hand, mirroring this component's
  own `playground/assemblies.ts`. Proven working composed inside `accordion`'s `action-list.ts`.
- **Non-root parts of a reference are addressed with a dot**: `listbox.content`, `listbox.item`,
  `listbox.itemText` — a bare `content` resolves nowhere in the OWNING assembly's own anatomy and
  silently renders no children, no error (found live composing this exact component into
  `accordion`'s `itemContent`).
- **`item`'s own native click composes fine with an assembly's `on.click`** — both fire from the
  same click (proven live: `accordion`'s `action-list.ts` dispatches a `"select"` event carrying
  the whole item as `payload` via the empty-path marker, `path: ""`, while Ark's own selection
  still happens normally in the same click).
- **No floating layer, no `Portal`, no open/closed pair anywhere** — unlike `select`, there is
  nothing here that Zag hides with the native `hidden` attribute, so the `display`-vs-`[hidden]`
  conflict that broke `select`'s `content` cannot happen to this component's own parts the same
  way. `itemIndicator` still uses `hidden` for its unchecked case (the kit sets it, not Zag) — the
  shipped recipe already scopes `display` to `states.checked` only; don't set an unconditional
  `display` on it if the recipe ever changes, for the same reason `select`'s `content` couldn't.
- **A repeated, per-instance controlled `value` needs binding to real data, not `defaultValue`, if
  more than one instance exists and only one should reflect an outside fact.** See `accordion`'s
  own notes — its `action-list.ts` composes exactly one `listbox` per section this way.
- **Known open gap (as of 2026-08-31, PWEB-211):** `playground/parts.ts` still annotates `parts`
  with the wide `Record<ListboxPart, PassportPartEditorInfo<ListboxPart>>` form rather than `as
  const`. A typo in a state name there will NOT be caught by `tsc` — only by `defineEditorInfo`'s
  runtime check, one step later than on `accordion`/`select`/`button`, where this was already
  fixed. Same fix applies here; just not done yet.
<!-- user:end -->
