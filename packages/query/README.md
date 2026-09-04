# @web-core/query

Данные из сети web-core поверх `@tanstack/solid-query` — самый распространённый выбор для
Solid сегодня (та же семья, что и `@web-core/router`; версии `solid-query` и
`solid-router` идут в одном темпе выпуска у TanStack). Приложение импортирует ровно этот
пакет — никогда `@tanstack/solid-query` напрямую, — той же причиной, что у `router`/`store`:
единый путь резолва даёт единый `QueryClientContext` на всё приложение.

Три подпутя:

- `.` — весь `@tanstack/solid-query` реэкспортом (сам пакет уже реэкспортирует
  `@tanstack/query-core` целиком — фильтровать вручную незачем, та же логика, что у `router`).
- `./devtools` — `SolidQueryDevtools`, отдельно от `.`, чтобы не тянуться в прод случайно.
- `./persist` — сохранение кэша между перезагрузками (`persistQueryClient` +
  `createSyncStoragePersister` одним подпутём — на практике их всегда берут вместе).

## Установка и вайринг

```jsonc
// package.json приложения
"dependencies": {
  "@web-core/query": "workspace:*"
}
```

`@tanstack/solid-query` — НЕ peer: приложение никогда не импортирует его напрямую (в отличие
от `@web-core/router`, тут нет порождённого кода со своим hardcoded-импортом
вендора), значит прятать версию целиком безопасно — как у `@web-core/store`.

```tsx
// src/main.tsx
import { mount } from "@web-core/runtime";
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

## Две ловушки Solid-адаптера — обе меняют поведение молча, без ошибки типов

**1. Опции — ФУНКЦИЯ, не голый объект.** Solid не перерендеривает компонент при смене пропа —
внутренности `createQuery` отслеживают реактивность САМИ, и без обёртки в функцию `queryKey`
просто не увидит смену `id()`:

```tsx
// ❌ застынет на первом значении id — React-привычка здесь не работает
const query = createQuery({ queryKey: ["todo", id()], queryFn: () => fetchTodo(id()) });

// ✅ вызывается заново при каждом отслеживаемом изменении внутри
const query = createQuery(() => ({ queryKey: ["todo", id()], queryFn: () => fetchTodo(id()) }));
```

**2. Результат — реактивный стор, не деструктурировать.** `query.data`/`query.isPending`
читаются свойством в реактивном скоупе (JSX, `createMemo`, …); `const { data } = query` рвёт
подписку — деструктуризация снимает копию один раз, а не следит за изменением:

```tsx
const query = createQuery(() => ({ queryKey: ["todos"], queryFn: fetchTodos }));

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

Хуки существуют в двух написаниях: `useQuery`/`useMutation`/`useInfiniteQuery`/`useQueries`
(общее для всех фреймворков TanStack) и `createQuery`/`createMutation`/`createInfiniteQuery`/
`createQueries` — буквальные алиасы (`typeof useQuery`), под solid-конвенцию `create*`, которой
в web-core держатся `createSignal`/`createStore`/`createMachine`. Используйте `create*` —
примеры здесь и далее на нём.

## Devtools

```tsx
import { SolidQueryDevtools } from "@web-core/query/devtools";

{import.meta.env.DEV && <SolidQueryDevtools />}
```

## Пара с роутером: данные грузятся ДО рендера маршрута

`@web-core/router` кладёт `queryClient` в контекст роутера через
`createRootRouteWithContext`, и `loader` маршрута тянет данные заранее — тогда переход не
показывает пустой экран, ожидая `createQuery` уже ПОСЛЕ монтирования:

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

`queryOptions(...)` (реэкспортирован из `.`) — способ описать `todoQuery(id)` один раз и
переиспользовать её и в `loader`, и в `createQuery` компонента с сохранением типов ключа.

## Сохранение кэша между перезагрузками

```ts
import { QueryClient } from "@web-core/query";
import { createSyncStoragePersister, persistQueryClient } from "@web-core/query/persist";

const queryClient = new QueryClient();
persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({ storage: window.localStorage }),
});
```
