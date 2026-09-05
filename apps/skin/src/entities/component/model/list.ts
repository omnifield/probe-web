import { KIT } from "@web-core/ui";

/** Имена компонентов кита — отсортированные, чистые данные, без формы под конкретного потребителя. */
export function listComponents(): readonly string[] {
  return Object.keys(KIT).sort();
}
