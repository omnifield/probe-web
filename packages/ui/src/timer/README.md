# Timer

**Group:** other · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the timer as a whole — holds the count and the start/pause/reset actions |
| area | wraps the time-unit display — announces changes to assistive tech |
| control | wraps the action buttons (start, pause, resume, reset, restart) |
| item | one time unit — renders its own formatted value as text (e.g. "05") |
| itemLabel | one time unit's own label (e.g. "min") — content is the consumer's |
| itemValue | one time unit's own numeric value, decomposed from `item`'s all-in-one text — content is the consumer's |
| actionTrigger | one action button (start, pause, resume, reset, or restart) — hidden by the kit while its action doesn't apply |
| separator | between two time units (e.g. the ":" in "05:30") |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| area | — | — | — |
| control | — | — | — |
| item | days | [data-type="days"] | this is the days unit |
| item | hours | [data-type="hours"] | this is the hours unit |
| item | minutes | [data-type="minutes"] | this is the minutes unit |
| item | seconds | [data-type="seconds"] | this is the seconds unit |
| item | milliseconds | [data-type="milliseconds"] | this is the milliseconds unit |
| itemLabel | days | [data-type="days"] | this is the days unit |
| itemLabel | hours | [data-type="hours"] | this is the hours unit |
| itemLabel | minutes | [data-type="minutes"] | this is the minutes unit |
| itemLabel | seconds | [data-type="seconds"] | this is the seconds unit |
| itemLabel | milliseconds | [data-type="milliseconds"] | this is the milliseconds unit |
| itemValue | days | [data-type="days"] | this is the days unit |
| itemValue | hours | [data-type="hours"] | this is the hours unit |
| itemValue | minutes | [data-type="minutes"] | this is the minutes unit |
| itemValue | seconds | [data-type="seconds"] | this is the seconds unit |
| itemValue | milliseconds | [data-type="milliseconds"] | this is the milliseconds unit |
| actionTrigger | hover | :hover | pointer is over this button |
| actionTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| actionTrigger | active | :active | this button is being held down |
| separator | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| item | `--value` | kit | the raw numeric count behind the formatted text (e.g. `5`, not `"05"`) |

## Notes

<!-- user:start -->
## Overview

Timer is a start/pause/reset stopwatch or countdown — a live time display (days/hours/minutes/
seconds/milliseconds, whichever units the consumer composes) plus a row of action buttons. It
counts up from zero by default, or down from `startMs` when `countdown` is set.

## Features

- **Counts up or down** — `countdown` switches direction; `startMs` sets the initial value,
  `targetMs` sets where counting up stops (or, in countdown mode, the floor it counts down to).
- **Configurable tick rate** — `interval` (default `1000`ms) controls how often the count updates;
  set it lower (e.g. `100`) to display fractions of a second.
- **`onComplete`/`onTick` callbacks** — `onComplete` fires once the timer reaches its target;
  `onTick` fires on every update, useful for driving something outside the timer itself.
- **Actions hide themselves when they don't apply** — `actionTrigger` uses the native `hidden`
  attribute, not a mark, to show only the buttons that make sense for the current run state (e.g.
  no "pause" button before the timer has started).
- **`item` carries the raw number behind its formatted text** — `--value` is the actual numeric
  count for that unit (e.g. `5`, not `"05"`), there for a skin that wants to compute from it rather
  than parse the rendered string.
- **`itemLabel`/`itemValue` are real, hand-authored parts** — Ark ships no Solid component for
  either (only the underlying Zag connector functions exist), so the kit builds them itself off the
  same public `useTimerContext()` hook every other part uses internally. They behave like any other
  kit part; nothing about using them differs from `item` or `separator`.
- **No settings at all** — declared as a fact: none of `countdown`/`autoStart`/`interval`/`startMs`/
  `targetMs` is part of the kit's closed settings vocabulary.

## Anatomy

```tsx
import {
  Timer,
  TimerArea,
  TimerItem,
  TimerSeparator,
  TimerControl,
  TimerActionTrigger,
} from "@omnifield/probe-web-ui";

<Timer countdown startMs={60_000}>
  <TimerArea>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
    <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>
```

`TimerItem` is self-filling — it renders its own formatted text and accepts no children. Optional
label/value breakdown parts nest the same way, alongside or instead of `TimerItem`:

```tsx
import { TimerItemLabel, TimerItemValue } from "@omnifield/probe-web-ui";

<TimerArea>
  <TimerItemValue type="minutes" />
  <TimerItemLabel type="minutes">min</TimerItemLabel>
</TimerArea>
```

## Examples

### Count-up stopwatch, stopping at a target

```tsx
<Timer targetMs={60 * 60 * 1000} startMs={40 * 60 * 1000}>
  <TimerArea>
    <TimerItem type="hours" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
    <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
  </TimerControl>
</Timer>
```

### Countdown

```tsx
<Timer countdown startMs={5 * 60 * 1000}>
  <TimerArea>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>
```

### A faster tick rate, for showing milliseconds

```tsx
<Timer interval={100} targetMs={60 * 1000}>
  <TimerArea>
    <TimerItem type="seconds" />
    <TimerSeparator>.</TimerSeparator>
    <TimerItem type="milliseconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>
```

### Observing ticks and completion

```tsx
import { createSignal } from "solid-js";

const [ticks, setTicks] = createSignal(0);

<Timer
  targetMs={60 * 1000}
  onComplete={() => console.log("done")}
  onTick={() => setTicks((t) => t + 1)}
>
  <TimerArea>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>
```

## Styling hooks

Four of the eight parts — `root`, `area`, `control`, `separator` — carry no marks of any kind; they
are bare wrappers. `item`/`itemLabel`/`itemValue` share one five-valued `data-type`
(`"days"|"hours"|"minutes"|"seconds"|"milliseconds"`) — the same "one shared attribute, several real
values" shape the date picker's `view` and the menu's item `type` use. `actionTrigger` has only the
plain button's own pseudo-classes (`:hover`/`:focus-visible`/`:active`) — no `data-*` mark of its
own. Notably, **whether the timer is running or paused is never exposed as an attribute anywhere** —
the only externally visible trace is which `actionTrigger`s the kit chooses to hide, not a
`data-state` a skin could select on; style the timer's "running" look, if you need one, from your own
application state rather than looking for a mark that doesn't exist.

## Accessibility

`area` renders with `role="timer"`, so assistive tech announces count changes without the consumer
wiring up a live region themselves. Beyond that, Timer has no dedicated WAI-ARIA widget pattern or
keyboard table of its own in Ark's documentation — it's a live region plus a set of ordinary
buttons, and each `actionTrigger` follows the plain [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
(`Space`/`Enter` to activate, `Tab` to move focus) rather than a timer-specific interaction model.
<!-- user:end -->
