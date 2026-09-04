# 🌐 web-core Query

🏷️ data · 🧬 engine · 📦 `@web-core/query`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

⚡ Данные из сети web-core поверх `@tanstack/solid-query` — та же семья, что и
`@web-core/router` (версии `solid-query`/`solid-router` идут в одном темпе выпуска у TanStack).
Приложение импортирует ровно этот пакет — никогда `@tanstack/solid-query` напрямую, — той же
причиной, что у `router`/`store`: единый путь резолва даёт единый `QueryClientContext` на всё
приложение, а не два из-за двух копий пакета. 🔄 `@tanstack/solid-query` уже сам реэкспортирует
`@tanstack/query-core` целиком — фильтровать вручную незачем.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-узлов — «часть» означает подпуть поставки, «адрес» — импорт-спецификатор,
которым эта часть достаётся. Три подпути: корень — весь `@tanstack/solid-query`, `./devtools` и
`./persist` — отдельными дверьми, чтобы приложение импортировало ровно то, что использует.

| Часть          | Адрес                    | Экспортирует                                                                                                                                                                                                                    |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Данные из сети | `@web-core/query`         | весь `@tanstack/solid-query` (`useQuery`/`createQuery`, `useMutation`/`createMutation`, `useInfiniteQuery`/`createInfiniteQuery`, `useQueries`/`createQueries`, `QueryClient`, `QueryClientProvider`, `queryOptions`, `infiniteQueryOptions`, `mutationOptions`, `useIsFetching`, `useIsMutating`, …), весь `@tanstack/query-core` реэкспортом |
| Devtools       | `@web-core/query/devtools` | `SolidQueryDevtools`, `SolidQueryDevtoolsPanel`                                                                                                                                                                               |
| Persist        | `@web-core/query/persist`  | `persistQueryClient`, `createSyncStoragePersister`, весь `@tanstack/query-persist-client-core` (`persistQueryClientRestore`, `persistQueryClientSave`, `persistQueryClientSubscribe`, ретрай-стратегии, `createPersister`)  |

📦 Внутри `@web-core/query`: `src/index.ts` (тонкий реэкспорт), `src/engine/index.ts` (реальный
`export * from "@tanstack/solid-query"` вместе с обоснованием полноты реэкспорта),
`src/devtools/index.ts`, `src/persist/index.ts` — каждый подпуть в своей папке, по образцу
`@web-core/store`'s `./machine`.

<h2 id="использование">🚀 Использование</h2>

✅ Вайринг клиента в приложение, запрос, мутация и devtools покрывают то, чем реально пишется код
с этим пакетом.

**Вайринг:**

```jsonc
// package.json приложения
"dependencies": {
  "@web-core/query": "workspace:*"
}
```

```tsx
// src/main.tsx
import { mount } from "@web-core/shared";
import { QueryClient, QueryClientProvider } from "@web-core/query";
import { RouterProvider } from "@web-core/router";

import { router } from "./router.js";

const queryClient = new QueryClient();

mount(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
));
```

**`createQuery` — опции ФУНКЦИЕЙ, результат читается свойством (не деструктурировать):**

```tsx
const query = createQuery(() => ({ queryKey: ["todo", id()], queryFn: () => fetchTodo(id()) }));

return (
  <Switch>
    <Match when={query.isPending}>Loading…</Match>
    <Match when={query.isError}>Error: {query.error?.message}</Match>
    <Match when={query.isSuccess}>
      <For each={query.data}>{(todo) => <p>{todo.title}</p>}</For>
    </Match>
  </Switch>
);
```

**`createMutation`:**

```tsx
const mutation = createMutation(() => ({ mutationFn: saveTodo }));

<button onClick={() => mutation.mutate(todo)} disabled={mutation.isPending}>
  {mutation.isSuccess ? "saved" : "save"}
</button>;
```

**Devtools:**

```tsx
import { SolidQueryDevtools } from "@web-core/query/devtools";

{import.meta.env.DEV && <SolidQueryDevtools />}
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 У пакета нет своей сущности настроек — это опции конструкторов вендора, реэкспортированных как
есть. Таблица — именованные опции по функциям, к которым они относятся.

| Настройка                                                      | Где                                            | Тип                                     | По умолчанию                    |
| ---------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------ | ----------------------------------- |
| `defaultOptions.queries`/`defaultOptions.mutations`               | `new QueryClient(config)`                         | `QueryObserverOptions`/`MutationObserverOptions` | нет дефолтов вендора                |
| `queryKey`/`queryFn`/`staleTime`/`gcTime`/`retry`/…                | `createQuery(() => options)`                      | `QueryOptions`                              | зависит от поля                     |
| `mutationFn`/`onSuccess`/`onError`/…                               | `createMutation(() => options)`                   | `MutationOptions`                           | —                                    |
| `initialIsOpen`                                                    | `<SolidQueryDevtools>`                            | `boolean`                                   | `false`                              |
| `buttonPosition`                                                   | `<SolidQueryDevtools>`                            | `"top-left"\|"top-right"\|"bottom-left"\|"bottom-right"` | `"bottom-right"`     |
| `position`                                                         | `<SolidQueryDevtools>`                            | `"top"\|"bottom"\|"left"\|"right"`          | `"bottom"`                           |
| `errorTypes`                                                       | `<SolidQueryDevtools>`                            | `DevtoolsErrorType[]`                       | `[]`                                 |
| `queryClient`/`persister`/`buster`                                 | `persistQueryClient(options)`                     | `PersistQueryClientOptions`                 | `buster` — `""`                      |
| `maxAge`                                                           | `persistQueryClient` (restore-часть)              | `number` (мс)                               | 24 часа (вендор)                     |
| `dehydrateOptions`/`hydrateOptions`                                | `persistQueryClient` (save/restore-часть)         | `DehydrateOptions`/`HydrateOptions`         | —                                    |
| `storage`                                                          | `createSyncStoragePersister(options)`             | `Storage \| undefined \| null`              | обязательное                         |
| `key`                                                              | `createSyncStoragePersister`                      | `string`                                    | `"REACT_QUERY_OFFLINE_CACHE"`        |
| `throttleTime`                                                     | `createSyncStoragePersister`                      | `number` (мс)                               | `1000`                               |
| `serialize`/`deserialize`                                          | `createSyncStoragePersister`                      | функции                                     | `JSON.stringify`/`JSON.parse`        |
| `retry`                                                            | `createSyncStoragePersister`                      | `PersistRetryer`                            | —                                    |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Ни одно из состояний не придумано этим пакетом — все взяты как есть из типов
`@tanstack/query-core`.

| Состояние            | Метка                                      | Где                              |
| ---------------------- | --------------------------------------------- | ------------------------------------ |
| Запрос ждёт/упал/готов | `status: "pending" \| "error" \| "success"`   | `QueryObserverResult`, `createQuery` |
| Сетевая активность     | `fetchStatus: "fetching" \| "paused" \| "idle"` | `QueryObserverResult`               |
| Флаги-геттеры          | `isPending`/`isError`/`isSuccess`/`isFetching`/`isStale`/… | `QueryObserverResult`   |
| Мутация                | `status: "idle" \| "pending" \| "success" \| "error"` | `MutationObserverResult`, `createMutation` |

<h2 id="io">🔌 IO</h2>

↔️ Вход и выход у каждого конструктора — своя форма, унаследованная от вендора без изменений.

### 📥 Вход

| Конструктор                   | Принимает                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `createQuery(options)`            | `Accessor<UseQueryOptions>` — ФУНКЦИЯ, не голый объект (тип называется иначе, но это `Accessor`) |
| `createMutation(options)`         | `Accessor<UseMutationOptions>`                                                                   |
| `new QueryClient(config?)`        | `QueryClientConfig` — `{ defaultOptions?, queryCache?, mutationCache? }`                         |
| `persistQueryClient(options)`     | `{ queryClient, persister, buster?, maxAge?, dehydrateOptions?, hydrateOptions? }`                |
| `createSyncStoragePersister(options)` | `{ storage, key?, throttleTime?, serialize?, deserialize?, retry? }`                          |

### 📤 Выход

| Источник                       | Отдаёт                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `createQuery(...)`                  | `Proxy` над Solid-стором (`QueryObserverResult`) — читать свойством, не деструктурировать         |
| `createMutation(...)`               | `MutationObserverResult` + `mutate`/`mutateAsync`                                                |
| `persistQueryClient(...)`           | `[unsubscribe: () => void, restorePromise: Promise<void>]`                                       |
| `createSyncStoragePersister(...)`   | `Persister` — `{ persistClient, restoreClient, removeClient }`                                    |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Только композиции, реально прогнанные рендером в тестах — не теоретические примеры.

| Сборка                                    | Что доказывает                                                    | Файл                  |
| -------------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `QueryClientProvider` + `createQuery`         | реальный рендер, `loading` → `hi` после резолва `queryFn`, `queryFn` вызван 1 раз | `test/query.test.tsx` |
| `QueryClientProvider` + `createMutation`      | реальный рендер, `save` → `saved` после клика и резолва `mutationFn`   | `test/query.test.tsx` |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Данные грузятся ДО рендера маршрута: `@web-core/router` кладёт `queryClient` в контекст роутера
через `createRootRouteWithContext`, `loader` маршрута тянет данные заранее — переход не показывает
пустой экран, ожидая `createQuery` уже ПОСЛЕ монтирования.

```ts
// src/router.ts
import { createRootRouteWithContext, createRouter, defaultRouterOptions } from "@web-core/router";
import type { QueryClient } from "@web-core/query";

export function createAppRouteTree(queryClient: QueryClient) {
  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ /* … */ });
  // …
  return rootRoute;
}
```

```tsx
// src/routes/todos/$todoId.tsx
import { createFileRoute } from "@web-core/router";

import { todoQuery } from "../../queries/todo.js";

export const Route = createFileRoute("/todos/$todoId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(todoQuery(params.todoId)),
  component: () => {
    const query = createQuery(() => todoQuery(Route.useParams()().todoId));
    return <h1>{query.data?.title}</h1>;
  },
});
```

`queryOptions(...)` — способ описать `todoQuery(id)` один раз и переиспользовать её и в `loader`,
и в `createQuery` компонента с сохранением типов ключа.

Сохранение кэша между перезагрузками добавляется отдельным подпутём, поверх того же клиента:

```ts
import { QueryClient } from "@web-core/query";
import { createSyncStoragePersister, persistQueryClient } from "@web-core/query/persist";

const queryClient = new QueryClient();
persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({ storage: window.localStorage }),
});
```
