# Toggle

**Group:** other · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the toggle as a whole — a single `<button aria-pressed>`, wraps `indicator` |
| indicator | the glyph shown inside the button — an icon, a checkmark, whatever the consumer puts inside it |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | on | [data-state="on"] | the toggle is pressed |
| root | off | [data-state="off"] | the toggle is not pressed |
| root | pressed | [data-pressed] | the toggle is pressed — the same fact as `on`, encoded as presence rather than a two-valued attribute |
| root | disabled | [data-disabled] | the toggle is disabled — it cannot be pressed |
| indicator | on | [data-state="on"] | the toggle is pressed |
| indicator | off | [data-state="off"] | the toggle is not pressed |
| indicator | pressed | [data-pressed] | the toggle is pressed — the same fact as `on`, encoded as presence rather than a two-valued attribute |
| indicator | disabled | [data-disabled] | the toggle is disabled — it cannot be pressed |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Toggle is a single two-state button — one node a person presses to switch something on or off, with
no separate "value" of its own beyond that boolean. It's the smallest Ark-provided component after
the avatar: two parts, no settings.

**Not the same component as the kit's older, Kobalte-backed `toggle.tsx` primitive** — same English
word, unrelated modules; this one is the Ark-provided `root`/`indicator` pair described here.

## Features

- **Controlled or uncontrolled** — `pressed` + `onPressedChange` for controlled use, `defaultPressed`
  for uncontrolled.
- **The same on/off fact carried three different ways at once** — native `aria-pressed` (for
  assistive tech), the two-valued `data-state` (`"on"`/`"off"`), and the presence-only
  `data-pressed`. All three are real and independently declared, not one derived from another.
- **`indicator` carries the identical marks independently** — not inherited visually from `root`; a
  skin styling the glyph directly has its own address for the same on/off/disabled facts.
- **A dedicated fallback for the "off" glyph** — `ToggleIndicator`'s `fallback` prop renders content
  for the unpressed state, while its children render the pressed state; there's no need to branch on
  `data-state` yourself just to swap the glyph.
- **No settings at all** — declared as a fact: the toggle accepts none of the kit's closed settings
  vocabulary.

## Anatomy

```tsx
import { Toggle, ToggleIndicator } from "@omnifield/probe-web-ui";

<Toggle>
  <ToggleIndicator fallback={/* content shown while OFF */}>
    {/* content shown while ON */}
  </ToggleIndicator>
</Toggle>
```

## Examples

### Basic, uncontrolled

```tsx
<Toggle defaultPressed>
  <ToggleIndicator>★</ToggleIndicator>
</Toggle>
```

### Controlled, with a different glyph per state

```tsx
import { createSignal } from "solid-js";

const [pressed, setPressed] = createSignal(false);

<Toggle pressed={pressed()} onPressedChange={setPressed}>
  <ToggleIndicator fallback={<HeartOutlineIcon />}>
    <HeartFilledIcon />
  </ToggleIndicator>
</Toggle>
```

### Disabled

```tsx
<Toggle disabled defaultPressed>
  <ToggleIndicator>★</ToggleIndicator>
</Toggle>
```

## Styling hooks

`root` and `indicator` both expose the identical set of marks (see `packages/skin`): `data-state`
(`"on"`/`"off"`), the presence-only `data-pressed`, and `data-disabled`. Since two of those —
`data-state` and `data-pressed` — encode the exact same fact in different shapes, a skin picks
whichever reads more naturally for the rule at hand (a two-valued attribute selector, or a bare
presence check) rather than being forced into one. `root` additionally carries the native
`aria-pressed`, which exists for assistive tech, not styling — a skin has no reason to select on it
when `data-state`/`data-pressed` already carry the same fact as real marks.

## Accessibility

Toggle follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) with
a pressed state (`aria-pressed`), the same pattern a native toggle button follows.

| Key | What it does |
|---|---|
| `Space` / `Enter` | Toggles the pressed state |
| `Tab` | Moves focus onto or off of the toggle |
<!-- user:end -->
