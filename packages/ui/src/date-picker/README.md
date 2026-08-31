# Date Picker

**Group:** inputs · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| root | the whole date picker — label, control, and the floating calendar together |
| label | the picker's own label |
| control | wraps the input and the buttons that open/clear the picker — the row visible while closed |
| input | the typed-date field — one per index in range/multiple mode |
| clearTrigger | clears the selected value — hidden by the kit while nothing is selected |
| trigger | opens or closes the calendar panel |
| content | the floating panel — holds every view |
| positioner | positions the floating panel against the control — a pure wrapper, no look of its own |
| view | one view's panel (day, month, or year) — hidden while a different one is active |
| viewControl | wraps a view's own prev/next/toggle row |
| viewTrigger | switches to the next-broader view (day → month → year) |
| rangeText | the visible range's own label (e.g. a month name) — text set by the kit |
| prevTrigger | steps the visible range backward |
| nextTrigger | steps the visible range forward |
| monthSelect | jumps the focused month directly — a native dropdown |
| yearSelect | jumps the focused year directly — a native dropdown |
| table | the calendar grid — one per view |
| tableHead | wraps the grid's header row |
| tableHeader | one column's own header cell (a weekday, in the day view) |
| tableBody | wraps the grid's data rows |
| tableRow | one row — either the weekday header row, or one week (day view) / one row of months/years (other views) |
| tableCell | one grid cell — wraps the clickable trigger inside it |
| tableCellTrigger | the clickable surface inside a cell — picks that date/month/year |
| presetTrigger | jumps straight to a named range (e.g. "last 7 days") |
| valueText | shows the selected value(s) as text, formatted by the kit |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | open | [data-state="open"] | the calendar panel is showing |
| root | closed | [data-state="closed"] | the calendar panel is hidden |
| root | disabled | [data-disabled] | the whole picker is disabled |
| root | readonly | [data-readonly] | the value is visible, changing it is not possible |
| root | empty | [data-empty] | no value is selected yet |
| label | open | [data-state="open"] | the calendar panel is showing |
| label | closed | [data-state="closed"] | the calendar panel is hidden |
| label | disabled | [data-disabled] | the whole picker is disabled |
| label | readonly | [data-readonly] | the value is visible, changing it is not possible |
| control | disabled | [data-disabled] | the whole picker is disabled |
| control | empty | [data-placeholder-shown] | no value is selected yet |
| input | open | [data-state="open"] | the calendar panel is showing |
| input | closed | [data-state="closed"] | the calendar panel is hidden |
| input | empty | [data-placeholder-shown] | no value is selected yet |
| input | invalid | [data-invalid] | the enclosing form rejected the value |
| input | disabled | :disabled | this input cannot be used |
| input | readonly | :read-only | the value is visible, changing it is not possible |
| input | required | :required | the form will demand a value on submit |
| clearTrigger | hover | :hover | pointer is over this button |
| clearTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| clearTrigger | active | :active | this button is being held down |
| trigger | open | [data-state="open"] | the calendar panel is showing |
| trigger | closed | [data-state="closed"] | the calendar panel is hidden |
| trigger | empty | [data-placeholder-shown] | no value is selected yet |
| trigger | disabled | :disabled | this button cannot be used |
| content | open | [data-state="open"] | the calendar panel is showing |
| content | closed | [data-state="closed"] | the calendar panel is hidden |
| content | inline | [data-inline] | shown inline in the page flow, not floating over it |
| positioner | — | — | — |
| view | day | [data-view="day"] | showing the day grid — pick a date directly |
| view | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| view | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| viewControl | day | [data-view="day"] | showing the day grid — pick a date directly |
| viewControl | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| viewControl | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| viewTrigger | day | [data-view="day"] | showing the day grid — pick a date directly |
| viewTrigger | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| viewTrigger | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| viewTrigger | disabled | [data-disabled] | the whole picker is disabled |
| rangeText | — | — | — |
| prevTrigger | disabled | [data-disabled] | there is nothing earlier to step to |
| nextTrigger | disabled | [data-disabled] | there is nothing later to step to |
| monthSelect | disabled | :disabled | this control cannot be used |
| yearSelect | disabled | :disabled | this control cannot be used |
| table | day | [data-view="day"] | showing the day grid — pick a date directly |
| table | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| table | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| table | disabled | [data-disabled] | the whole picker is disabled |
| tableHead | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableHead | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableHead | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableHead | disabled | [data-disabled] | the whole picker is disabled |
| tableHeader | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableHeader | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableHeader | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableHeader | disabled | [data-disabled] | the whole picker is disabled |
| tableBody | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableBody | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableBody | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableBody | disabled | [data-disabled] | the whole picker is disabled |
| tableRow | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableRow | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableRow | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableRow | disabled | [data-disabled] | the whole picker is disabled |
| tableCell | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableCell | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableCell | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableCell | selected | [data-selected] | this cell's own value is the one currently selected (month/year views only) |
| tableCellTrigger | day | [data-view="day"] | showing the day grid — pick a date directly |
| tableCellTrigger | month | [data-view="month"] | showing the month grid — pick a month, then drill into its days |
| tableCellTrigger | year | [data-view="year"] | showing the year grid — pick a year, then drill into its months |
| tableCellTrigger | disabled | [data-disabled] | this cell cannot be picked |
| tableCellTrigger | selectable | [data-selectable] | this cell CAN be picked at all — the baseline every other state here refines |
| tableCellTrigger | selected | [data-selected] | this cell's own value is the one currently selected |
| tableCellTrigger | focus | [data-focus] | keyboard roving focus is on this cell |
| tableCellTrigger | outside-range | [data-outside-range] | belongs to the adjacent month/year, shown only to fill out the grid |
| tableCellTrigger | range-start | [data-range-start] | the first date of the selected range |
| tableCellTrigger | range-end | [data-range-end] | the last date of the selected range |
| tableCellTrigger | in-range | [data-in-range] | falls between the selected range's start and end |
| tableCellTrigger | in-hover-range | [data-in-hover-range] | falls between the range's start and wherever the pointer is hovering right now (range mode only) |
| tableCellTrigger | hover-range-start | [data-hover-range-start] | would become the range's start if clicked next (range mode only) |
| tableCellTrigger | hover-range-end | [data-hover-range-end] | would become the range's end if clicked next (range mode only) |
| tableCellTrigger | today | [data-today] | this cell is today's date (day view only) |
| tableCellTrigger | unavailable | [data-unavailable] | this date cannot be picked, e.g. outside min/max (day view only) |
| tableCellTrigger | weekend | [data-weekend] | this cell falls on a weekend (day view only) |
| tableCellTrigger | hover | :hover | pointer is over this button |
| tableCellTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| tableCellTrigger | active | :active | this button is being held down |
| presetTrigger | hover | :hover | pointer is over this button |
| presetTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| presetTrigger | active | :active | this button is being held down |
| valueText | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| positioner | `--reference-width` | kit | measured width of the control the panel is anchored to |
| positioner | `--reference-height` | kit | measured height of the control the panel is anchored to |
| positioner | `--available-width` | kit | space left before the panel would hit the viewport edge |
| positioner | `--available-height` | kit | space left before the panel would hit the viewport edge |

## Notes

<!-- user:start -->
## Overview

Date Picker is the kit's biggest Ark-provided component — 25 parts. It lets a person pick a date, a
range of dates, or several individual dates from a calendar: a small row (label, typed input,
open/clear buttons) stays visible while closed, and a floating panel with day/month/year views opens
on demand. It follows the same anatomy-owns-the-address device as the rest of the Ark-provided kit —
Ark itself sets every `data-scope`/`data-part` address, the kit only wraps.

## Features

- **Three selection modes** — `selectionMode`: `"single"` (default), `"multiple"`, or `"range"`.
- **One input per selected slot** — `input`'s `index` prop picks which date it edits; range mode
  renders two (`index={0}`/`index={1}`), multiple mode as many as `maxSelectedDates` allows.
- **Three drill-down views** — day → month → year, switched by `viewTrigger` or jumped to directly
  with the native `monthSelect`/`yearSelect` dropdowns; `minView`/`maxView` can cap which views are
  reachable at all (e.g. a month-only or year-only picker).
- **Presets** — `presetTrigger` jumps straight to a named range (e.g. "last 7 days"); its `value` is
  required.
- **Self-hiding clear button** — `clearTrigger` is hidden by the kit while nothing is selected.
- **Bounded and filtered dates** — `min`/`max` cap the selectable range; `isDateUnavailable` excludes
  arbitrary dates from either end (e.g. weekends, holidays).
- **Multiple months at once** — `numOfMonths` renders more than one calendar side by side.
- **Locale-aware formatting** — `locale`, `format`, `parse`, and `createCalendar` (for non-Gregorian
  calendars) all shape how a date reads and how typed input is parsed back.
- **Inline rendering** — `inline` renders the calendar directly in the page flow instead of as a
  floating panel; `content` carries a matching `data-inline` mark.
- **Week numbers** — `showWeekNumbers` adds a leading column; it's drawn by `WeekNumberCell` /
  `WeekNumberHeaderCell`, two real, separately-rendered components that share `tableCell`'s own
  address rather than carrying one of their own.
- **Real form participation** — `name` on the root makes the underlying `input`(s) submit like any
  other form field.

## Anatomy

```tsx
import {
  DatePicker,
  DatePickerLabel,
  DatePickerControl,
  DatePickerInput,
  DatePickerTrigger,
  DatePickerClearTrigger,
  DatePickerPositioner,
  DatePickerContent,
  DatePickerView,
  DatePickerViewControl,
  DatePickerPrevTrigger,
  DatePickerViewTrigger,
  DatePickerRangeText,
  DatePickerNextTrigger,
  DatePickerMonthSelect,
  DatePickerYearSelect,
  DatePickerTable,
  DatePickerTableHead,
  DatePickerTableRow,
  DatePickerTableHeader,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerPresetTrigger,
  DatePickerValueText,
} from "@omnifield/probe-web-ui";

<DatePicker>
  <DatePickerLabel>{/* text */}</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>{/* text or icon: opens/closes the panel */}</DatePickerTrigger>
    <DatePickerClearTrigger>{/* text or icon */}</DatePickerClearTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>
      {/* one DatePickerView per reachable view — "day", "month", "year" */}
      <DatePickerView view="day">
        <DatePickerViewControl>
          <DatePickerPrevTrigger>{/* text or icon */}</DatePickerPrevTrigger>
          {/* either a label showing/toggling the visible range... */}
          <DatePickerViewTrigger>
            <DatePickerRangeText />
          </DatePickerViewTrigger>
          {/* ...or, per Ark's own composition, direct month/year jump dropdowns instead */}
          <DatePickerMonthSelect />
          <DatePickerYearSelect />
          <DatePickerNextTrigger>{/* text or icon */}</DatePickerNextTrigger>
        </DatePickerViewControl>
        <DatePickerTable>
          <DatePickerTableHead>
            <DatePickerTableRow>
              {/* one DatePickerTableHeader per weekday */}
              <DatePickerTableHeader>{/* text */}</DatePickerTableHeader>
            </DatePickerTableRow>
          </DatePickerTableHead>
          <DatePickerTableBody>
            {/* one DatePickerTableRow per week (day view) / per row of months or years */}
            <DatePickerTableRow>
              {/* one DatePickerTableCell per day/month/year; `value` is required */}
              <DatePickerTableCell value={/* a DateValue, or a month/year number */}>
                <DatePickerTableCellTrigger>{/* text */}</DatePickerTableCellTrigger>
              </DatePickerTableCell>
            </DatePickerTableRow>
          </DatePickerTableBody>
        </DatePickerTable>
      </DatePickerView>
    </DatePickerContent>
  </DatePickerPositioner>
  <DatePickerPresetTrigger value="last7Days">{/* text */}</DatePickerPresetTrigger>
  <DatePickerValueText placeholder="No date selected" />
</DatePicker>
```

Unlike the rest of the kit's calendar-shaped views, **the kit does not re-export Ark's own
`Context`/`useDatePickerContext` helper** — the mechanism Ark's own docs use to generate a month's
worth of `weeks`/`weekDays` automatically. Every row and cell above has to be supplied by the
consumer, the same way `playground/assemblies.ts`'s own worked example does it: real `DateValue`s
(`parseDate`, re-exported from `@ark-ui/solid/date-picker`, the same package the kit wraps) passed
one by one into `DatePickerTableCell`'s `value`. `TableCell`'s `value` accepts either a `DateValue`
(day view) or a plain month/year number (month/year views).

## Examples

### Basic, single date

```tsx
<DatePicker>
  <DatePickerLabel>Date</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Open</DatePickerTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>
      <DatePickerView view="day">
        <DatePickerViewControl>
          <DatePickerPrevTrigger>Prev</DatePickerPrevTrigger>
          <DatePickerViewTrigger>
            <DatePickerRangeText />
          </DatePickerViewTrigger>
          <DatePickerNextTrigger>Next</DatePickerNextTrigger>
        </DatePickerViewControl>
        <DatePickerTable>
          <DatePickerTableHead>
            <DatePickerTableRow>
              <DatePickerTableHeader>Mo</DatePickerTableHeader>
              {/* ...one DatePickerTableHeader per remaining weekday */}
            </DatePickerTableRow>
          </DatePickerTableHead>
          <DatePickerTableBody>
            <DatePickerTableRow>
              <DatePickerTableCell value={someDate}>
                <DatePickerTableCellTrigger>1</DatePickerTableCellTrigger>
              </DatePickerTableCell>
              {/* ...the rest of the week/month, one real DateValue per cell */}
            </DatePickerTableRow>
          </DatePickerTableBody>
        </DatePickerTable>
      </DatePickerView>
    </DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

### A range, with two inputs and a preset

`selectionMode="range"` expects two `DatePickerInput`s, one per `index`:

```tsx
<DatePicker selectionMode="range">
  <DatePickerLabel>Stay dates</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput index={0} />
    <DatePickerInput index={1} />
    <DatePickerTrigger>Open</DatePickerTrigger>
    <DatePickerClearTrigger>Clear</DatePickerClearTrigger>
  </DatePickerControl>
  <DatePickerPresetTrigger value="last7Days">Last 7 days</DatePickerPresetTrigger>
  <DatePickerPositioner>
    <DatePickerContent>{/* same day-view table as above */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

Cells inside the range pick up `range-start` / `range-end` / `in-range` while a range is committed,
and `in-hover-range` / `hover-range-start` / `hover-range-end` while the pointer is hovering a
would-be range before the second click commits it.

### Several individual dates

`selectionMode="multiple"`, optionally capped by `maxSelectedDates`:

```tsx
<DatePicker selectionMode="multiple" maxSelectedDates={3}>
  <DatePickerLabel>Blackout dates</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Open</DatePickerTrigger>
    <DatePickerClearTrigger>Clear</DatePickerClearTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>{/* same day-view table as above */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

### Bounded and partly unavailable dates

`min`/`max` cap the range outright; `isDateUnavailable` excludes individual dates within it (here,
weekends) — cells picked up by either rule carry `unavailable`:

```tsx
import { parseDate } from "@ark-ui/solid/date-picker";

<DatePicker
  min={parseDate("2026-09-01")}
  max={parseDate("2026-12-31")}
  isDateUnavailable={(date) => date.toDate("UTC").getDay() % 6 === 0}
>
  <DatePickerLabel>Delivery date</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Open</DatePickerTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>{/* same day-view table as above */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

### Rendered inline, no floating panel

`inline` drops the popover behavior entirely — `positioner`/`content` stay in the page's own flow,
and `content` carries `data-inline` instead of the usual open/closed pair:

```tsx
<DatePicker inline defaultValue={[someDate]}>
  <DatePickerPositioner>
    <DatePickerContent>{/* same day-view table as above, always visible */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

## Styling hooks

Every mark in the States table above is a real selector a skin can hook into (see `packages/skin`),
and `tableCellTrigger` alone carries the bulk of the calendar's visual language — `selected`,
`range-start`/`range-end`/`in-range`, `in-hover-range` and its start/end pair, `today`,
`unavailable`, `weekend`, and `outside-range` are eleven independent marks a single cell can combine
(a cell can be `today` AND `weekend` AND `in-range` at once). `selectable` is the odd one out: it's
not a look, it's the baseline every other cell state refines — present on every cell that could be
clicked at all. As with the accordion's trigger, `input`'s `disabled`/`readonly`/`required` arrive as
native pseudo-classes (`:disabled`/`:read-only`/`:required`), not `data-*` attributes, because Zag
sets them on the real `<input>`; every other part's equivalent states use `data-*` instead.
`positioner`'s four CSS variables (`--reference-width`/`-height`, `--available-width`/`-height`) are
the same floating-panel-sizing mechanism the popover exposes — not specific to dates.

## Accessibility

Date Picker follows the WAI-ARIA [Date Picker (Dialog) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
applied to its calendar grid specifically:

| Key | What it does |
|---|---|
| `ArrowLeft` / `ArrowRight` | Moves focus to the previous / next day in the current week |
| `ArrowUp` / `ArrowDown` | Moves focus to the same weekday in the previous / next week |
| `Home` / `End` | Moves focus to the first / last day of the current month |
| `PageUp` / `PageDown` | Moves focus to the same day in the previous / next month |
| `Enter` | Selects the focused date and closes the picker |
| `Esc` | Closes the picker without selecting a date |
<!-- user:end -->
