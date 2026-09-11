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
которым эта часть достаётся. Пять подпутей, две несемейные группы:

- **Движок** — корень (весь `@tanstack/solid-query`), `./devtools`, `./persist`. Все трое реально
  работают с `QueryClient`/кэшем: devtools его подсматривает, persist сохраняет между
  перезагрузками.
- **Транспорт** — `./graphql`, `./rest`. Ни один не знает про `QueryClient` вообще — это функции
  «сходить в сеть, получить типизированный `Promise<T>`», которые ПОДСТАВЛЯЮТСЯ в `queryFn`/
  `mutationFn` движка. Разный протокол внутри (GraphQL/HTTP+JSON), но одна роль.

| Часть          | Адрес                    | Экспортирует                                                                                                                                                                                                                    |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Данные из сети | `@web-core/query`         | весь `@tanstack/solid-query` (`useQuery`/`createQuery`, `useMutation`/`createMutation`, `useInfiniteQuery`/`createInfiniteQuery`, `useQueries`/`createQueries`, `QueryClient`, `QueryClientProvider`, `queryOptions`, `infiniteQueryOptions`, `mutationOptions`, `useIsFetching`, `useIsMutating`, …), весь `@tanstack/query-core` реэкспортом |
| Devtools       | `@web-core/query/devtools` | `SolidQueryDevtools`, `SolidQueryDevtoolsPanel`                                                                                                                                                                               |
| Persist        | `@web-core/query/persist`  | `persistQueryClient`, `createSyncStoragePersister`, весь `@tanstack/query-persist-client-core` (`persistQueryClientRestore`, `persistQueryClientSave`, `persistQueryClientSubscribe`, ретрай-стратегии, `createPersister`)  |
| GraphQL        | `@web-core/query/graphql`  | `createGraphQLClient` (основной способ) + `graphqlRequest`/`gql`/`ClientError` (внутренности движка — см. ниже)                                                                                                               |
| REST           | `@web-core/query/rest`     | `createRestClient` (основной способ) + `restRequest`/`rawRestRequest`/`HTTPError`/`RestResult` (внутренности движка — см. ниже)                                                                                                |

⚠️ **`graphqlRequest`/`restRequest` — внутренности движка, не рекомендуемый способ.** Оба берут
url/эндпоинт параметром на КАЖДЫЙ вызов, а не один раз при старте — значит вызывающий код либо
повторяет url/headers в каждом `queryFn`, либо сам заворачивает пакет в свой клиент. Это ровно то,
чего движок должен избавлять: взяв эти функции напрямую вместо `createGraphQLClient`/
`createRestClient`, приложение СОЗНАТЕЛЬНО отказывается от механики движка и берёт конфигурацию
транспорта на себя. Оставлены как есть (уже используются, могут пригодиться для одноразового
запроса без клиента) — но это осознанный побег из движка, не витрина API.

📦 Внутри `@web-core/query`: `src/index.ts` (тонкий реэкспорт), `src/engine/index.ts` (реальный
`export * from "@tanstack/solid-query"` вместе с обоснованием полноты реэкспорта),
`src/devtools/index.ts`, `src/persist/index.ts`, `src/graphql/index.ts`, `src/rest/index.ts` —
каждый подпуть в своей папке, по образцу `@web-core/store`'s `./machine`.

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

**GraphQL — клиент конфигурируется ОДИН раз при старте, дальше только документ+переменные:**

```tsx
// src/api.ts — один раз на приложение
import { createGraphQLClient, gql } from "@web-core/query/graphql";

export const graphqlApi = createGraphQLClient({
  url: "/graphql",
  headers: { authorization: `Bearer ${getToken()}` },
});

export const todoQuery = gql`
  query Todo($id: Int!) {
    todo(id: $id) {
      title
    }
  }
`;
```

```tsx
// в компоненте — url/headers уже внутри graphqlApi, каждый вызов только документ+переменные
import { graphqlApi, todoQuery } from "../api.js";

const query = createQuery(() => ({
  queryKey: ["todo", id()],
  queryFn: () => graphqlApi.request<{ todo: { title: string } }>(todoQuery, { id: id() }),
}));
```

**REST — та же схема, `json` сериализует тело сам:**

```tsx
// src/api.ts
import { createRestClient } from "@web-core/query/rest";

export const restApi = createRestClient({
  baseUrl: "/api",
  headers: { authorization: `Bearer ${getToken()}` },
});
```

```tsx
import { HTTPError } from "@web-core/query/rest";
import { restApi } from "../api.js";

const query = createQuery(() => ({
  queryKey: ["todo", id()],
  queryFn: () => restApi.request<{ title: string }>(`/todos/${id()}`),
}));

const mutation = createMutation(() => ({
  mutationFn: (title: string) => restApi.request("/todos", { method: "POST", json: { title } }),
  onError: (error) => {
    if (error instanceof HTTPError && error.response.status === 409) {
      /* … */
    }
  },
}));
```

**REST — `.raw`/`rawRestRequest`, когда статус/заголовки ответа нужны и на успехе** (не только на
ошибке через `HTTPError.response`): инструмент-«постман», которому важно показать `response.status`
и `response.headers`, а не только тело.

```tsx
const { data, response } = await restApi.raw<{ title: string }>(`/todos/${id()}`);
console.log(response.status, response.headers.get("x-request-id"), data);
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
| `createGraphQLClient(config)`     | `{ url: string, headers?: HeadersInit }` — один раз при старте, дальше держит их сам             |
| `createRestClient(config)`        | `{ baseUrl: string, headers?: HeadersInit }` — один раз при старте, дальше держит их сам          |
| `<graphqlApi>.request(document, variables?)` | результат `createGraphQLClient(...)`'s поле — url/headers уже внутри клиента               |
| `<restApi>.request(path, init?)`  | результат `createRestClient(...)`'s поле — `init?: RequestInit & { json?: unknown }`, per-call `headers` перекрывают клиентские по имени |
| `<restApi>.raw(path, init?)`      | тот же вход, что и `.request`, но отдаёт `response`+`data` и на успехе тоже — см. "Выход"          |
| `graphqlRequest(url, document, variables?, headers?)` ⚠️ внутренности | `url: string`, `document: RequestDocument \| TypedDocumentNode`, `variables?: Variables`, `headers?: HeadersInit` — url/headers на КАЖДЫЙ вызов, без клиента; см. "Анатомия" |
| `restRequest(input, init?)` ⚠️ внутренности | `input: string \| URL`, `init?: RequestInit & { json?: unknown }` — url на КАЖДЫЙ вызов, без клиента; см. "Анатомия" |
| `rawRestRequest(input, init?)` ⚠️ внутренности | тот же вход, что и `restRequest` — url/`init` на КАЖДЫЙ вызов, без клиента; см. "Анатомия" |

### 📤 Выход

| Источник                       | Отдаёт                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| `createQuery(...)`                  | `Proxy` над Solid-стором (`QueryObserverResult`) — читать свойством, не деструктурировать         |
| `createMutation(...)`               | `MutationObserverResult` + `mutate`/`mutateAsync`                                                |
| `persistQueryClient(...)`           | `[unsubscribe: () => void, restorePromise: Promise<void>]`                                       |
| `createSyncStoragePersister(...)`   | `Persister` — `{ persistClient, restoreClient, removeClient }`                                    |
| `createGraphQLClient(...)`          | `{ request }` — тот же `Promise<TResult>`/`ClientError`, что и `graphqlRequest`, но без url/headers на вызове |
| `createRestClient(...)`             | `{ request, raw }` — `request` тот же `Promise<TResult>`/`HTTPError`, что и `restRequest`; `raw` тот же `Promise<RestResult<TResult>>`, что и `rawRestRequest` — оба без baseUrl/headers на вызове |
| `graphqlRequest(...)` ⚠️ внутренности | `Promise<TResult>` — данные из `data` ответа; на GraphQL-ошибках/не-2xx кидает `ClientError`      |
| `restRequest(...)` ⚠️ внутренности  | `Promise<TResult>` — JSON или текст тела по `content-type`, `undefined` на `204`/пустом теле; на не-2xx кидает `HTTPError` (несёт `response`+разобранное `data`) |
| `rawRestRequest(...)` ⚠️ внутренности | `Promise<RestResult<TResult>>` — `{ response, data }`, ТА ЖЕ форма на успехе, что несёт `HTTPError` на ошибке (`response`+`data`); тело разобрано так же, как у `restRequest` |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Только композиции, реально прогнанные рендером в тестах — не теоретические примеры.

| Сборка                                    | Что доказывает                                                    | Файл                  |
| -------------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `QueryClientProvider` + `createQuery`         | реальный рендер, `loading` → `hi` после резолва `queryFn`, `queryFn` вызван 1 раз | `test/query.test.tsx` |
| `QueryClientProvider` + `createMutation`      | реальный рендер, `save` → `saved` после клика и резолва `mutationFn`   | `test/query.test.tsx` |
| `QueryClientProvider` + `createQuery` + `graphqlRequest` | внутренности: реальный рендер, `loading` → `hi` через мок `fetch`; тело запроса (`query`+`variables`) проверено byte-level | `test/graphql.test.tsx` |
| `QueryClientProvider` + `createQuery` + `createGraphQLClient` | основной способ: url/headers заданы один раз в клиенте, реальный рендер `loading` → `hi`, заголовок из клиента доехал до `fetch` | `test/graphql.test.tsx` |
| `QueryClientProvider` + `createQuery`/`createMutation` + `restRequest` | внутренности: реальный рендер (`queryFn` и `mutationFn`), `json`-шорткат проверен byte-level (`body`+`content-type`), не-2xx доезжает до `HTTPError` | `test/rest.test.tsx` |
| `QueryClientProvider` + `createQuery` + `createRestClient` | основной способ: `baseUrl`+путь соединены, per-call `headers` перекрывают клиентские по имени | `test/rest.test.tsx` |
| `rawRestRequest`/`<restApi>.raw` | на успехе `{ response, data }` не теряет статус/заголовки — постман-путь, симметричный `HTTPError` на ошибке | `test/rest.test.tsx` |

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
