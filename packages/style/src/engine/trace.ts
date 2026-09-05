// Тонкая обёртка над @web-core/trace — раньше своя копия реализации, из-за цикла зависимостей
// при установке (`@web-core/trace` тянул `@web-core/style`, `style` зависит от `build`). Цикл
// снят при выделении трейсера из `@web-core/shared` — см. ROADMAP.yaml зоны `trace`.

import { createTracer } from "@web-core/trace";

export const trace = createTracer("style");
