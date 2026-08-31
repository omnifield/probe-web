# Menu

**Group:** overlays · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| arrow | wraps `arrowTip` — positioned by the kit, no graphic of its own |
| arrowTip | the visible triangle inside `arrow` — a skin draws its shape, typically a rotated square |
| positioner | positions `content` against whichever trigger opened it — a pure wrapper, no look of its own |
| content | the floating panel — holds real keyboard focus for every item at once |
| indicator | a small marker on `trigger` for whether the menu is open — no graphic of its own |
| trigger | opens the menu |
| triggerItem | a submenu's own trigger, rendered as an item of its parent menu |
| contextTrigger | wraps an element so right-click (or long-press) opens the menu at the pointer |
| separator | a visual/semantic divider between groups of items |
| itemGroup | wraps a labeled cluster of items |
| itemGroupLabel | the group's own heading |
| item | one action — plain, or checkbox/radio-shaped (data-type tells which) |
| itemIndicator | a checkmark/dot slot inside a checkbox/radio item — hidden by the kit while unchecked |
| itemText | an item's own label text |

## States

| part | state | mark | meaning |
|---|---|---|---|
| arrow | — | — | — |
| arrowTip | — | — | — |
| positioner | — | — | — |
| content | open | [data-state="open"] | the menu is showing |
| content | closed | [data-state="closed"] | the menu is hidden |
| indicator | open | [data-state="open"] | the menu is showing |
| indicator | closed | [data-state="closed"] | the menu is hidden |
| trigger | open | [data-state="open"] | the menu is showing |
| trigger | closed | [data-state="closed"] | the menu is hidden |
| trigger | current | [data-current] | this is the trigger that opened the menu (multi-trigger menus only) |
| trigger | hover | :hover | pointer is over this button |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this button is being held down |
| triggerItem | open | [data-state="open"] | the menu is showing |
| triggerItem | closed | [data-state="closed"] | the menu is hidden |
| triggerItem | disabled | [data-disabled] | this item (and the submenu it opens) cannot be chosen |
| triggerItem | highlighted | [data-highlighted] | the current keyboard/pointer target |
| contextTrigger | open | [data-state="open"] | the menu is showing |
| contextTrigger | closed | [data-state="closed"] | the menu is hidden |
| contextTrigger | current | [data-current] | this is the trigger that opened the menu (multi-trigger menus only) |
| separator | — | — | — |
| itemGroup | — | — | — |
| itemGroupLabel | — | — | — |
| item | disabled | [data-disabled] | this item cannot be chosen |
| item | highlighted | [data-highlighted] | the current keyboard/pointer target — a virtual fact, not real DOM focus |
| item | checked | [data-state="checked"] | this checkbox/radio item is checked |
| item | unchecked | [data-state="unchecked"] | this checkbox/radio item is not checked |
| item | radio | [data-type="radio"] | this is a radio-shaped item — one of a mutually exclusive set |
| item | checkbox | [data-type="checkbox"] | this is a checkbox-shaped item — independently toggleable |
| itemIndicator | disabled | [data-disabled] | this item cannot be chosen |
| itemIndicator | highlighted | [data-highlighted] | the current keyboard/pointer target — a virtual fact, not real DOM focus |
| itemIndicator | checked | [data-state="checked"] | this checkbox/radio item is checked |
| itemIndicator | unchecked | [data-state="unchecked"] | this checkbox/radio item is not checked |
| itemText | disabled | [data-disabled] | this item cannot be chosen |
| itemText | highlighted | [data-highlighted] | the current keyboard/pointer target — a virtual fact, not real DOM focus |
| itemText | checked | [data-state="checked"] | this checkbox/radio item is checked |
| itemText | unchecked | [data-state="unchecked"] | this checkbox/radio item is not checked |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| positioner | `--reference-width` | kit | measured width of the trigger the menu is positioned against |
| positioner | `--reference-height` | kit | measured height of the trigger the menu is positioned against |
| positioner | `--available-width` | kit | space left before the panel would hit the viewport edge |
| positioner | `--available-height` | kit | space left before the panel would hit the viewport edge |

## Notes

<!-- user:start -->
## Overview

Menu is a floating list of actions that opens from a button, a right-click, or a long-press —
plain items, checkbox items, radio items, submenus, and groups, all sharing one floating panel.
Fourteen parts; like the dialog and popover, the root itself renders no DOM node.

## Features

- **The root is pure context** — same shape as `Dialog`/`Popover`/`Drawer`: `trigger`/
  `contextTrigger` are real DOM siblings of `positioner`, not its ancestors or descendants.
- **Three ways to open it** — `trigger` (click), `contextTrigger` (wraps an element so right-click,
  or a ~700ms long-press on touch/pen, opens the menu at the pointer), or a submenu's own
  `triggerItem`, rendered as an item of its parent menu.
- **Checkbox and radio items reuse `item`'s own address** — `MenuCheckboxItem`/`MenuRadioItem`/
  `MenuRadioItemGroup` are real, separate components (with their own `checked`/`value`/
  `onCheckedChange` props), but they don't introduce new anatomy parts: they draw with `item`'s and
  `itemGroup`'s addresses, distinguished by `data-type` (`"checkbox"`/`"radio"`), not by a part of
  their own.
- **Highlight is virtual, not real DOM focus** — `item`'s `highlighted` state tracks the current
  keyboard/pointer target without moving actual focus off `content`, which holds real focus for
  every item at once; a skin styling "the highlighted item" selects `data-highlighted`, never
  `:focus`.
- **Nested submenus** — render another `Menu` inside an item's place and open it with
  `MenuTriggerItem` instead of `MenuTrigger`; `content` picks up `data-nested`/`data-has-nested`
  when menus stack.
- **Typeahead is on by default** — `typeahead` (default `true`) jumps to an item by typing its
  text; `valueText` on an item overrides what typeahead matches when the rendered text isn't the
  right match target.
- **Multiple triggers, one menu** — same device as the dialog/drawer: a `trigger`'s `value`
  distinguishes which one opened a shared menu, and only that trigger carries `data-current`; the
  menu repositions to whichever trigger was activated.
- **Custom `id` on an item breaks internal lookups** — Ark autogenerates item ids for its own
  `getElementById` bookkeeping; passing a custom `id` prop to `item` overrides that and breaks it —
  don't set one.
- **Links render via `asChild` on the item itself, not inside it** — wrap the item, don't nest an
  `<a>` as a child, so the link receives the item's own ARIA attributes and keyboard handling.
- **This kit doesn't use a `Portal` anywhere** — unlike Ark's own docs, which portal every
  `Positioner`, no component in this kit re-exports or requires one.

## Anatomy

```tsx
import {
  Menu,
  MenuTrigger,
  MenuIndicator,
  MenuPositioner,
  MenuContent,
  MenuArrow,
  MenuArrowTip,
  MenuItemGroup,
  MenuItemGroupLabel,
  MenuItem,
  MenuItemText,
  MenuItemIndicator,
  MenuSeparator,
} from "@omnifield/probe-web-ui";

<Menu>
  <MenuTrigger>
    {/* text or icon */}
    <MenuIndicator>{/* icon, reflects open/closed */}</MenuIndicator>
  </MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuArrow>
        <MenuArrowTip />
      </MenuArrow>
      <MenuItemGroup>
        <MenuItemGroupLabel>{/* text */}</MenuItemGroupLabel>
        <MenuItem value="rename">{/* text */}</MenuItem>
      </MenuItemGroup>
      <MenuSeparator />
      <MenuItem value="notify">
        <MenuItemIndicator>{/* icon */}</MenuItemIndicator>
        <MenuItemText>{/* text */}</MenuItemText>
      </MenuItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

## Examples

### Basic

```tsx
<Menu>
  <MenuTrigger>
    File
    <MenuIndicator>▾</MenuIndicator>
  </MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuItem value="new-file">New File</MenuItem>
      <MenuItem value="open">Open…</MenuItem>
      <MenuItem value="save">Save</MenuItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

### Checkbox items

```tsx
import { createSignal } from "solid-js";
import { MenuCheckboxItem } from "@omnifield/probe-web-ui";

const [showToolbar, setShowToolbar] = createSignal(true);

<Menu>
  <MenuTrigger>View</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuCheckboxItem
        value="toolbar"
        checked={showToolbar()}
        onCheckedChange={setShowToolbar}
      >
        <MenuItemIndicator>✓</MenuItemIndicator>
        <MenuItemText>Show Toolbar</MenuItemText>
      </MenuCheckboxItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

### Radio items

```tsx
import { createSignal } from "solid-js";
import { MenuRadioItemGroup, MenuRadioItem } from "@omnifield/probe-web-ui";

const [sortBy, setSortBy] = createSignal("date");

<Menu>
  <MenuTrigger>Sort</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuRadioItemGroup value={sortBy()} onValueChange={(details) => setSortBy(details.value)}>
        <MenuItemGroupLabel>Sort By</MenuItemGroupLabel>
        <MenuRadioItem value="name">
          <MenuItemIndicator>✓</MenuItemIndicator>
          <MenuItemText>Name</MenuItemText>
        </MenuRadioItem>
        <MenuRadioItem value="date">
          <MenuItemIndicator>✓</MenuItemIndicator>
          <MenuItemText>Date Modified</MenuItemText>
        </MenuRadioItem>
      </MenuRadioItemGroup>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

### Context menu

```tsx
import { MenuContextTrigger } from "@omnifield/probe-web-ui";

<Menu>
  <MenuContextTrigger>Right click here</MenuContextTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuItem value="cut">Cut</MenuItem>
      <MenuItem value="copy">Copy</MenuItem>
      <MenuItem value="paste">Paste</MenuItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

### A submenu

```tsx
import { MenuTriggerItem } from "@omnifield/probe-web-ui";

<Menu>
  <MenuTrigger>File</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuItem value="new">New File</MenuItem>
      <Menu>
        <MenuTriggerItem>Share</MenuTriggerItem>
        <MenuPositioner>
          <MenuContent>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="message">Message</MenuItem>
          </MenuContent>
        </MenuPositioner>
      </Menu>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

## Styling hooks

`content`/`indicator`/`trigger`/`triggerItem`/`contextTrigger` all carry the open/closed pair (see
`packages/skin`); `item`/`itemIndicator`/`itemText` share `disabled`/`highlighted`/`checked`/
`unchecked`, plus `item` alone carries `data-type` (`"radio"`/`"checkbox"`) for the item shapes that
have one. `positioner`'s four CSS variables (`--reference-width`/`-height`,
`--available-width`/`-height`) are the same floating-panel-sizing mechanism the popover/select/date-
picker expose. Remember `highlighted` tracks a virtual keyboard/pointer target, not real DOM
focus — style it instead of `:focus` for the "current item" look.

## Accessibility

Menu follows the WAI-ARIA [Menu/Menu bar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

| Key | What it does |
|---|---|
| `Space` / `Enter` | Activates/selects the highlighted item |
| `ArrowDown` / `ArrowUp` | Highlights the next / previous item |
| `ArrowRight` / `ArrowLeft` | On the trigger, opens or closes a submenu (direction depends on reading direction) |
| `Esc` | Closes the menu and moves focus to the trigger |
<!-- user:end -->
