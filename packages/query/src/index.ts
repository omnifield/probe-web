// Единственная точка входа в данные из сети web-core (PROBEWEB-4): приложение не импортирует
// `@tanstack/solid-query` (или `@tanstack/query-core`) напрямую — та же причина, что у
// `./router` и `./store`: единый путь резолва даёт единый экземпляр модуля, а значит один
// `QueryClientContext` на всё приложение, а не два из-за двух копий пакета.
//
// Полный реэкспорт: `@tanstack/solid-query` уже сам реэкспортирует `@tanstack/query-core`
// целиком (`export * from "@tanstack/query-core"` в его собственном входе) — фильтровать
// вручную значило бы дублировать список, который вендор и так поддерживает за нас.
//
// Хуки существуют в двух равнозначных написаниях — `useQuery`/`useMutation`/… (общее для всех
// фреймворков TanStack) и `createQuery`/`createMutation`/… (алиасы, `typeof useQuery` и т.д.,
// под конвенцию Solid `create*`, которой в этом репозитории держатся `createSignal`,
// `createResource`, `createStore`, `createMachine`). Разницы в поведении нет — `create*` здесь
// приведён как рекомендуемый в примерах README ради единообразия с остальным кодом web-core.
export * from "@tanstack/solid-query";
