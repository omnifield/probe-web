import { KIT } from "@web-core/ui";

// ВРЕМЕННЫЙ ФИЛЬТР (user, 2026-09-06) — скины доводятся по одному, остальные компоненты кита
// пока скрыты из витрины. Список пуст → всё выключено; готов скин компонента — имя добавляется
// сюда одной строкой. Убрать вместе с этим фильтром, когда доведены все.
const ENABLED: readonly string[] = ["button"];

/** Имена компонентов кита — отсортированные, чистые данные, без формы под конкретного потребителя. */
export function listComponents(): readonly string[] {
  return Object.keys(KIT)
    .filter((component) => ENABLED.includes(component))
    .sort();
}
