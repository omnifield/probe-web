// см. README.md / FAQ.md

import { allowedInside } from "../engine/nesting.js";
import type { Registry } from "../engine/registry.js";

/** Может ли ЭТА часть компонента вообще принимать контент — по правилу допуска реестра, не по
 * тому, сколько детей у конкретного узла есть прямо сейчас. Структурный вопрос, не про данные —
 * два разных потребителя (`contentOf`'s null-vs-`<For>`, `rendered`'s закрытая-часть-оверлея)
 * должны видеть один и тот же ответ. Разбор — FAQ.md. */
export function takesContent(registry: Registry, type: string): boolean {
  const allowed = allowedInside(registry, type);
  if (!allowed) return false;
  return (
    allowed.unrestricted ||
    allowed.parts.length > 0 ||
    allowed.genera.length > 0 ||
    allowed.components
  );
}
