import { defineLibraryConfig } from "@web-core/build/vite";

// Два входа: корневой — нейтральное ядро (никогда не тянет `@web-core/neurobox`/TanStack AI в
// бандл потребителя, который его не импортирует); `./neurobox` — фича-адаптер отдельным подпутём,
// тем же приёмом, что подпути `@web-core/ui` (`./component-registry` и т.п.) — агентность опциональна
// архитектурно (ROADMAP, `chat-core-agnostic-decision`), значит и физически, не только на словах.
export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts", solid: true },
    { name: "neurobox", source: "src/features/neurobox/index.ts", solid: true },
  ],
});
