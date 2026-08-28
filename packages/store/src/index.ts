// Единственная точка входа в «лёгкий» слой стейта probe-web (PROBEWEB-4): приложение не
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
// (`x()`, не `x`) — то же устройство, что у `useParams`/`useSearch` в `@omnifield/probe-web-router`.
//
// Для явных стейт-машин (guards, вложенные состояния, акторы) — соседний подпуть `./machine`,
// он опциональный (`xstate`/`@xstate/solid` — опциональные peer, ставятся отдельно).
export * from "@xstate/store-solid";
