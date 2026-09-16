// АНАЛИТИКА МАГАЗИНА — диаграммы и таблицы вперемешку. Где у графика есть таблица-пара, обе
// строятся из ОДНИХ данных: так видно, что столбец и строка говорят об одном и том же.
import type { CompositionElement } from "@web-core/assembly";

import {
  barChart,
  button,
  column,
  flow,
  grid,
  scatter,
  series,
  sparkline,
  table,
  timeChart,
  typography,
  widget,
  type Category,
} from "./shared";

// --- KPI ---
const kpi = (title: string, value: string, delta: string, values: readonly number[]) =>
  widget(title, delta, typography("heading-2", value), sparkline(series(values)));

// --- Трафик по каналам: столбцы + таблица ---
const channels = [
  { channel: "Поиск", visits: 48200, conversion: 3.4, revenue: 4120000 },
  { channel: "Прямые", visits: 31500, conversion: 4.1, revenue: 3380000 },
  { channel: "Соцсети", visits: 22800, conversion: 1.9, revenue: 1210000 },
  { channel: "Рассылка", visits: 12400, conversion: 5.6, revenue: 1840000 },
  { channel: "Реклама", visits: 18900, conversion: 2.3, revenue: 1470000 },
];
const channelBars: Category[] = channels.map((row) => ({ label: row.channel, value: row.visits / 1000 }));

// --- Регионы: столбцы + таблица ---
const regions = [
  { region: "Москва", orders: 5840, avgCheck: 4210, share: 38 },
  { region: "Санкт-Петербург", orders: 2910, avgCheck: 3980, share: 19 },
  { region: "Екатеринбург", orders: 1320, avgCheck: 3510, share: 9 },
  { region: "Казань", orders: 1180, avgCheck: 3440, share: 8 },
  { region: "Новосибирск", orders: 990, avgCheck: 3620, share: 6 },
  { region: "Остальные", orders: 3070, avgCheck: 3150, share: 20 },
];
const regionBars: Category[] = regions.map((row) => ({ label: row.region, value: row.share }));

// --- Эндпоинты: рассеяние + таблица самых медленных ---
const endpoints = [
  { path: "/api/catalog", rps: 820, p95: 96, errors: 0.1 },
  { path: "/api/search", rps: 610, p95: 284, errors: 0.4 },
  { path: "/api/cart", rps: 430, p95: 132, errors: 0.2 },
  { path: "/api/checkout", rps: 120, p95: 412, errors: 1.8 },
  { path: "/api/payments", rps: 95, p95: 356, errors: 2.3 },
  { path: "/api/profile", rps: 260, p95: 74, errors: 0.1 },
  { path: "/api/reviews", rps: 180, p95: 188, errors: 0.3 },
  { path: "/api/recommend", rps: 540, p95: 241, errors: 0.6 },
];

export const analyticsDashboard: CompositionElement = flow("column", [
  flow("row", [
    typography("heading-1", "Аналитика магазина"),
    {
      type: "segment-group",
      props: { defaultValue: "30d" },
      children: [
        { type: "segment-group.indicator" },
        ...[
          ["7d", "7 дней"],
          ["30d", "30 дней"],
          ["90d", "Квартал"],
        ].map(([value, label]) => ({
          type: "segment-group.item",
          props: { value },
          children: [
            { type: "segment-group.itemControl" },
            { type: "segment-group.itemText", children: [{ genus: "text" as const, value: label }] },
          ],
        })),
      ],
    },
    button("secondary", "Экспорт"),
  ]),

  grid([
    kpi("Выручка", "12,0 млн ₽", "+8,4% к прошлому периоду", [8.1, 8.6, 8.4, 9.2, 9.8, 10.1, 10.6, 10.4, 11.2, 11.7, 12.0]),
    kpi("Заказы", "15 310", "+5,1%", [11.2, 11.9, 12.4, 12.1, 13.0, 13.4, 13.9, 14.2, 14.8, 15.0, 15.3]),
    kpi("Средний чек", "3 870 ₽", "−1,2%", [3.95, 3.98, 3.92, 3.9, 3.94, 3.88, 3.91, 3.86, 3.89, 3.85, 3.87]),
    kpi("Возвраты", "2,1%", "−0,3 п.п.", [2.6, 2.5, 2.7, 2.4, 2.4, 2.3, 2.5, 2.2, 2.2, 2.1, 2.1]),
  ]),

  grid([
    widget(
      "Выручка по дням",
      "30 дней, тыс. ₽",
      timeChart(
        series([
          310, 342, 298, 365, 402, 455, 438, 330, 351, 377, 390, 421, 468, 452, 344, 362, 381, 399, 430, 486, 470,
          358, 372, 395, 410, 447, 502, 488, 376, 401,
        ]),
        600,
        ["area", "line"],
      ),
    ),
    widget(
      "Трафик по каналам",
      "Поиск · Прямые · Соцсети · Рассылка · Реклама, тыс. визитов",
      barChart(channelBars, 50),
      table({
        columns: [
          column("channel", "Канал"),
          column("visits", "Визиты"),
          column("conversion", "Конверсия, %"),
          column("revenue", "Выручка, ₽"),
        ],
        data: channels,
        defaultSorting: [{ columnId: "revenue", desc: true }],
      }),
    ),
  ]),

  grid([
    widget(
      "География",
      "доля заказов по регионам, %",
      barChart(regionBars, 40),
      table({
        columns: [
          column("region", "Регион"),
          column("orders", "Заказы"),
          column("avgCheck", "Средний чек, ₽"),
          column("share", "Доля, %"),
        ],
        data: regions,
        defaultSorting: [{ columnId: "orders", desc: true }],
      }),
    ),
    widget(
      "Производительность API",
      "p95, мс от запросов в секунду · медленные сверху",
      scatter(
        endpoints.map((row) => ({ x: row.rps, y: row.p95 })),
        900,
        450,
      ),
      table({
        columns: [
          column("path", "Эндпоинт"),
          column("rps", "RPS"),
          column("p95", "p95, мс"),
          column("errors", "Ошибки, %"),
        ],
        data: endpoints,
        defaultSorting: [{ columnId: "p95", desc: true }],
      }),
    ),
  ]),

  widget(
    "Последние транзакции",
    "выбор строк для массовых действий · новые сверху",
    table({
      columns: [
        column("id", "ID"),
        column("time", "Время"),
        column("customer", "Покупатель"),
        column("method", "Способ"),
        column("amount", "Сумма, ₽"),
        column("status", "Статус"),
      ],
      data: [
        { id: "T-90412", time: "16.09 12:41", customer: "Мария Л.", method: "Карта", amount: 18400, status: "успешно" },
        { id: "T-90411", time: "16.09 12:37", customer: "Олег П.", method: "СБП", amount: 7250, status: "успешно" },
        { id: "T-90410", time: "16.09 12:30", customer: "Ирина С.", method: "Карта", amount: 32990, status: "отклонено" },
        { id: "T-90409", time: "16.09 12:22", customer: "Денис К.", method: "Кредит", amount: 64300, status: "на проверке" },
        { id: "T-90408", time: "16.09 12:15", customer: "Анна В.", method: "СБП", amount: 12100, status: "успешно" },
        { id: "T-90407", time: "16.09 12:03", customer: "Павел Н.", method: "Карта", amount: 5680, status: "возврат" },
      ],
      defaultSorting: [{ columnId: "time", desc: true }],
      enableRowSelection: true,
      defaultColumnPinning: { start: ["id"], end: [] },
    }),
    flow("row", [button("secondary", "Выгрузить выбранные"), button("error-quiet", "Оформить возврат")]),
  ),
]);
