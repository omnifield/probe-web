// STRUCTURAL assembly templates for the date picker — read by `./index.ts`'s `defineEditorInfo`
// call (`PWEB-127`).
//
// ONE assembly, the day view — the doc-comment example in `../components/index.tsx`, with ONE
// real week of `tableCell`s (not a synthesized month): `root`(`label` + `control`(`input` +
// `trigger` + `clearTrigger`) + `positioner`(`content`(`view="day"`(`viewControl`(`prevTrigger` +
// `viewTrigger`(`rangeText`) + `nextTrigger`) + `table`(`tableHead`(`tableRow`(seven
// `tableHeader`s)) + `tableBody`(`tableRow`(seven `tableCell`s, each wrapping a
// `tableCellTrigger`))))))).
//
// Dates are REAL `DateValue`s (`parseDate`, re-exported by `@ark-ui/solid/date-picker` — the same
// device the select's own `createListCollection` already stands on for non-JSON-shaped sample
// data), not strings: `TableCellProps.value` is typed `DateValue`, and the rendered picker is the
// SAME live Ark component every other assembly in the kit mounts — `today`/`selected`/`weekend`
// are computed by the real machine against these real dates, not hand-set.
//
// SCOPE CUT, named: the week (24–30 Aug 2026) stays inside one month on purpose, so it shows
// `today`/`selected`/`weekend` but not `outside-range` — a second row spanning a month boundary
// would show that one, left for whoever extends this assembly next.

import { parseDate } from "@ark-ui/solid/date-picker";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DatePickerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEK = ["24", "25", "26", "27", "28", "29", "30"].map((day) => parseDate(`2026-08-${day}`));

export const assemblies: readonly PassportAssembly<DatePickerPart>[] = [
  {
    name: "basic",
    means: "рабочий календарь: открыт, неделя дней, 25-е выбрано, 27-е — сегодня",
    tree: {
      part: "root",
      props: { defaultOpen: true, defaultValue: [WEEK[1]] },
      children: [
        { part: "label", children: [{ genus: "text", value: "Дата" }] },
        {
          part: "control",
          children: [
            { part: "input" },
            { part: "trigger", children: [{ genus: "text", value: "📅" }] },
            { part: "clearTrigger", children: [{ genus: "text", value: "✕" }] },
          ],
        },
        {
          part: "positioner",
          children: [
            {
              part: "content",
              children: [
                {
                  part: "view",
                  props: { view: "day" },
                  children: [
                    {
                      part: "viewControl",
                      children: [
                        { part: "prevTrigger", children: [{ genus: "text", value: "‹" }] },
                        { part: "viewTrigger", children: [{ part: "rangeText" }] },
                        { part: "nextTrigger", children: [{ genus: "text", value: "›" }] },
                      ],
                    },
                    {
                      part: "table",
                      children: [
                        {
                          part: "tableHead",
                          children: [
                            {
                              part: "tableRow",
                              children: WEEKDAYS.map((day) => ({
                                part: "tableHeader" as const,
                                children: [{ genus: "text" as const, value: day }],
                              })),
                            },
                          ],
                        },
                        {
                          part: "tableBody",
                          children: [
                            {
                              part: "tableRow",
                              children: WEEK.map((date, index) => ({
                                part: "tableCell" as const,
                                props: { value: date },
                                children: [
                                  {
                                    part: "tableCellTrigger" as const,
                                    children: [{ genus: "text" as const, value: String(24 + index) }],
                                  },
                                ],
                              })),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
