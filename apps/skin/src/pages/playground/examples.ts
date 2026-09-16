// СПИСОК ПРИМЕРОВ ПЛЕЙГРАУНДА — сборки из `./examples/`, между которыми переключается селект страницы.
// Новый пример: положить JSON в `examples/` и дописать сюда строку. `value` — ключ, уникальный в списке.
import type { CompositionElement } from "@web-core/assembly";

import { analyticsDashboard } from "./examples/analytics-dashboard";
import cardsGallery from "./examples/cards-gallery.json";
import dashboardForms from "./examples/dashboard-forms.json";
import dashboardTables from "./examples/dashboard-tables.json";
import { dashboardWidgets } from "./examples/dashboard-widgets";
import projectDashboard from "./examples/project-dashboard.json";
import testModule from "./examples/test-module.json";

export type PlaygroundExample = {
  value: string;
  label: string;
  composition: CompositionElement;
};

export const EXAMPLES: readonly PlaygroundExample[] = [
  {
    value: "test-module",
    label: "Тестовый модуль",
    composition: testModule as CompositionElement,
  },
  {
    value: "project-dashboard",
    label: "Панель проекта",
    composition: projectDashboard as CompositionElement,
  },
  {
    value: "cards-gallery",
    label: "Галерея карточек",
    composition: cardsGallery as CompositionElement,
  },
  {
    value: "dashboard-widgets",
    label: "Виджеты дэшборда",
    composition: dashboardWidgets,
  },
  {
    value: "dashboard-tables",
    label: "Дэшборд с таблицами",
    composition: dashboardTables as CompositionElement,
  },
  {
    value: "dashboard-forms",
    label: "Дэшборд с формами",
    composition: dashboardForms as CompositionElement,
  },
  {
    value: "analytics-dashboard",
    label: "Аналитика: графики и таблицы",
    composition: analyticsDashboard,
  },
];
