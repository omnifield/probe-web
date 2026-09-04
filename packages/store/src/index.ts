// Единственная точка входа в «лёгкий» слой стейта web-core (PROBEWEB-4): приложение не
// импортирует `@xstate/store`/`@xstate/store-solid` напрямую — по той же причине, что и у
// `router`, — единый путь резолва даёт единый экземпляр модуля.
//
// `@xstate/store-solid` уже реэкспортирует `@xstate/store` целиком (`createStore`, атомы
// `createAtom`/`createAsyncAtom`/`createReducerAtom`, `shallowEqual`, …) и добавляет к нему
// четыре solid-хука (`useSelector`, `useStore`, `useAtom`, `useAtomState`) — реэкспортировать
// это заново вручную значило бы держать список в синхроне с двумя вендорами сразу. Здесь та
// же логика, что у `./router`: задача пакета — быть единственным путём резолва, а не
// фильтровать поверхность.
//
// Это и есть «zustand для Solid»: `createStore({ context, on })` — глобальное реактивное
// хранилище, `useSelector(store, (s) => s.context.x)` — точечная подписка, отдаёт АКСЕССОР
// (`x()`, не `x`) — то же устройство, что у `useParams`/`useSearch` в `@web-core/router`.
//
// Для явных стейт-машин (guards, вложенные состояния, акторы) — соседний подпуть `./machine`,
// он опциональный (`xstate`/`@xstate/solid` — опциональные peer, ставятся отдельно).
export * from "@xstate/store-solid";

// Один флоу для «стор посчитал/получил значение», синхронно или асинхронно, — `createResourceAtom`
// из `./resource.js`. Подробности и довод — там же.
export { createResourceAtom } from "./resource.js";
export type { ResourceFetcherInfo, ResourceState } from "./resource.js";

/**
 * НЕ используйте: `createAsyncAtom` апстрима теряет связь с зависимостями сразу после первого
 * резолва промиса — подтверждено на `@xstate/store@4.2.3` (детали и повтор — комментарий в
 * `./resource.js`). Локальный экспорт здесь намеренно перекрывает `createAsyncAtom` из
 * `export * from "@xstate/store-solid"` выше (именованный экспорт побеждает у звёздочного при
 * коллизии имён — поведение спецификации ES-модулей, не хак) и меняет сигнатуру, чтобы вызов по
 * старой апстримной форме падал уже на типах. Замена — `createResourceAtom` (см. выше).
 */
export function createAsyncAtom(): never {
  throw new Error(
    "createAsyncAtom не работает с реактивными зависимостями (см. комментарий в " +
      "@web-core/store/src/index.ts) — используйте createResourceAtom из этого пакета",
  );
}
