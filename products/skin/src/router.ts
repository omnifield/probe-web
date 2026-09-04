// Роутер витрины (`PWEB-173`, итерация 1 — подключение, не рефактор состояния под URL).
//
// `createRouter()` зовётся ЗДЕСЬ, приложением, не обёрткой пакета — это та самая точка, где
// TypeScript выводит тип дерева маршрутов из аргумента и привязывает его к `Register`
// (см. `@web-core/router`'s README, «Вайринг: src/router.ts»).

import { createRouter, defaultRouterOptions } from "@web-core/router";

import { routeTree } from "./routeTree.gen.js";

export const router = createRouter({ ...defaultRouterOptions, routeTree });

declare module "@web-core/router" {
  interface Register {
    router: typeof router;
  }
}
