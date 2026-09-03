import { parseDate } from "@ark-ui/solid/date-picker";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";

import type { Data } from "../../entity/io.js";
import { passport } from "../../entity/passport.js";

type DatePickerPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const WEEK = ["24", "25", "26", "27", "28", "29", "30"].map((day) => parseDate(`2026-08-${day}`));

export const basic: PassportAssembly<DatePickerPart, string, Data> = {
  name: "basic",
  means: "рабочий календарь: открыт, одна неделя дней, 25-е выбрано, 27-е сегодня — подпись из данных, сама сетка структурная (см. README)",
  tree: {
    node: "root",
    props: { defaultOpen: true, defaultValue: [WEEK[1]] },
    children: [
      { node: "label", children: [{ genus: "text", value: { path: "/label" } }] },
      {
        node: "control",
        children: [
          { node: "input" },
          { node: "trigger", children: [{ genus: "text", value: "📅" }] },
          { node: "clearTrigger", children: [{ genus: "text", value: "✕" }] },
        ],
      },
      {
        node: "positioner",
        children: [
          {
            node: "content",
            children: [
              {
                node: "view",
                props: { view: "day" },
                children: [
                  {
                    node: "viewControl",
                    children: [
                      { node: "prevTrigger", children: [{ genus: "text", value: "‹" }] },
                      { node: "viewTrigger", children: [{ node: "rangeText" }] },
                      { node: "nextTrigger", children: [{ genus: "text", value: "›" }] },
                    ],
                  },
                  {
                    node: "table",
                    children: [
                      {
                        node: "tableHead",
                        children: [
                          {
                            node: "tableRow",
                            children: WEEKDAYS.map((day) => ({
                              node: "tableHeader" as const,
                              children: [{ genus: "text" as const, value: day }],
                            })),
                          },
                        ],
                      },
                      {
                        node: "tableBody",
                        children: [
                          {
                            node: "tableRow",
                            children: WEEK.map((date, index) => ({
                              node: "tableCell" as const,
                              props: { value: date },
                              children: [
                                {
                                  node: "tableCellTrigger" as const,
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
};
