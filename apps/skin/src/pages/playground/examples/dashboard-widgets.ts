// ВИДЖЕТЫ ДЭШБОРДА — одни диаграммы. TS, а не JSON: см. шапку `./shared.ts`.
import type { CompositionElement } from "@web-core/assembly";

import { barChart, grid, scatter, series, sparkline, timeChart, typography, widget } from "./shared";

export const dashboardWidgets: CompositionElement = grid([
  widget(
    "Выручка",
    "12 месяцев, млн ₽",
    typography("display", "86 млн ₽"),
    typography("caption", "+16% к прошлому году"),
    sparkline(series([42, 48, 45, 53, 58, 55, 63, 68, 66, 74, 79, 86]), 76),
  ),
  widget(
    "Активные пользователи",
    "за 14 дней",
    typography("heading-2", "2 210"),
    timeChart(series([1180, 1320, 1250, 1410, 1560, 1490, 1720, 1680, 1810, 1950, 1890, 2040, 2130, 2210]), 2500, [
      "line",
      "point",
    ]),
  ),
  widget(
    "Нагрузка CPU",
    "последние 14 минут, %",
    typography("heading-2", "39%"),
    timeChart(series([34, 41, 38, 55, 72, 68, 49, 44, 61, 83, 77, 58, 46, 39]), 100, ["area", "line"]),
  ),
  widget(
    "Заказы",
    "по дням недели · Пн–Вс",
    typography("heading-2", "748"),
    barChart(
      [
        { label: "Пн", value: 86 },
        { label: "Вт", value: 102 },
        { label: "Ср", value: 95 },
        { label: "Чт", value: 118 },
        { label: "Пт", value: 142 },
        { label: "Сб", value: 131 },
        { label: "Вс", value: 74 },
      ],
      160,
    ),
  ),
  widget(
    "Время ответа API",
    "мс от запросов в секунду",
    typography("heading-2", "p95 · 248 мс"),
    scatter(
      [
        { x: 120, y: 82 },
        { x: 180, y: 95 },
        { x: 240, y: 101 },
        { x: 310, y: 118 },
        { x: 350, y: 112 },
        { x: 420, y: 140 },
        { x: 480, y: 151 },
        { x: 530, y: 176 },
        { x: 600, y: 190 },
        { x: 660, y: 232 },
        { x: 720, y: 248 },
        { x: 790, y: 301 },
      ],
      850,
      350,
    ),
  ),
  widget(
    "Воронка",
    "Визит · Каталог · Корзина · Оплата · Заказ, %",
    typography("heading-2", "15%"),
    barChart(
      [
        { label: "Визит", value: 100 },
        { label: "Каталог", value: 64 },
        { label: "Корзина", value: 31 },
        { label: "Оплата", value: 18 },
        { label: "Заказ", value: 15 },
      ],
      100,
    ),
  ),
]);
