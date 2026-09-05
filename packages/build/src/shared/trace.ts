// Perf-трейсы зоны build. ВНУТРЕННЕЕ — не в exports манифеста.
//
// Тонкая обёртка над @web-core/trace, как и у остальных зон кита — раньше здесь была своя
// копия реализации: `@web-core/trace` тянул `@web-core/style` (тестам нужен реальный CSS), а
// `style` сам зависит от `build`, и общий трейсер замкнул бы установку в цикл. Цикл снят, когда
// `@web-core/trace` лишился этой devDependency при выделении из `@web-core/shared` — обёртка
// восстановлена (см. ROADMAP.yaml зоны `trace`).

import { createTracer } from "@web-core/trace";

export const trace = createTracer("build");
