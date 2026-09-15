# 🧪 Примеры — как работать с `@web-core/query`

Рабочий код для локального теста, не канон. Архитектура и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

## 1. `createQuery` без сети

Самый быстрый способ увидеть реактивный запрос живьём — свой фетчер с задержкой, без бэкенда:

```tsx
import { QueryClient, QueryClientProvider, createQuery } from "@web-core/query";

const queryClient = new QueryClient();

function fakeFetchJoke() {
  return new Promise<string>((resolve) =>
    setTimeout(() => resolve("Почему у мидлварки нет друзей? Она всех прерывает."), 500),
  );
}

function Joke() {
  const query = createQuery(() => ({ queryKey: ["joke"], queryFn: fakeFetchJoke }));
  return <p>{query.isPending ? "грузим шутку…" : query.data}</p>;
}

export function CreateQueryDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <Joke />
    </QueryClientProvider>
  );
}
```

Полезно проверить: текст сначала "грузим шутку…", через 500мс сам меняется на результат — без
единого `createSignal` в компоненте, всё держит `query`.

## 2. `createMutation` без сети

Тот же приём, для записи — кнопка меняет подпись по статусу мутации:

```tsx
import { QueryClient, QueryClientProvider, createMutation } from "@web-core/query";

const queryClient = new QueryClient();

function fakeSave(title: string) {
  return new Promise<{ ok: true }>((resolve) => setTimeout(() => resolve({ ok: true }), 400));
}

function SaveButton() {
  const mutation = createMutation(() => ({ mutationFn: fakeSave }));
  return (
    <button onClick={() => mutation.mutate("демо")} disabled={mutation.isPending}>
      {mutation.isSuccess ? "сохранено" : mutation.isPending ? "сохраняю…" : "сохранить"}
    </button>
  );
}

export function CreateMutationDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <SaveButton />
    </QueryClientProvider>
  );
}
```

## 3. `defineQuery` (⚠️ эксперимент) — вызов по имени прогревает кэш для `.use()`

Ключевая проверка: жмёшь кнопку (имитация `loader`, вызов по имени, обычный `Promise`) — компонент
монтируется СРАЗУ с данными, без "загрузка…", и в консоли фетчер срабатывает только один раз, хотя
дёрнули его дважды (один раз кнопкой, второй раз при монтировании компонента через `.use()`):

```tsx
import { createSignal, Show } from "solid-js";
import { QueryClient, QueryClientProvider, defineQuery } from "@web-core/query";

const queryClient = new QueryClient();

function fakeFetchUser(id: string) {
  console.log("реальный фетч для id", id); // должно появиться в консоли ровно 1 раз
  return new Promise<{ id: string; name: string }>((resolve) =>
    setTimeout(() => resolve({ id, name: `Юзер ${id}` }), 600),
  );
}

const userQuery = defineQuery(
  queryClient,
  (id: string) => ["user", id],
  fakeFetchUser,
  { staleTime: Infinity },
);

function UserCard(props: { id: string }) {
  const query = userQuery.use(() => props.id);
  return <p>{query.isPending ? "загрузка…" : query.data?.name}</p>;
}

export function DefineQueryDemo() {
  const [prefetched, setPrefetched] = createSignal(false);

  return (
    <QueryClientProvider client={queryClient}>
      <button onClick={() => userQuery("42").then(() => setPrefetched(true))}>
        Прогреть кэш по имени (как loader)
      </button>
      <Show when={prefetched()}>
        <UserCard id="42" />
      </Show>
    </QueryClientProvider>
  );
}
```

Без клика на кнопку `<UserCard>` вообще не смонтирован — можно закомментировать `<Show>` и обернуть
`<UserCard id="42" />` напрямую, чтобы увидеть обычный путь БЕЗ прогрева: тогда `query.isPending`
будет `true` первые 600мс, а в консоли фетч всё равно один раз (это уже не про прогрев, а про то,
что `.use()` сам по себе работает).

## 4. GraphQL — живой прогон против `backend/presets`

Нужен локально поднятый бэк (`cd backend/presets && go run ./cmd/presets`, слушает `127.0.0.1:8787`
по умолчанию — `PRESETS_PORT`). Запрос `ListPresets` тот же, что реально используют
`packages/skin`/`apps/skin` (см. `packages/skin/src/presets/client/queries.ts`), здесь — упрощённый
для одних тегов:

```tsx
import { For } from "solid-js";
import { QueryClient, QueryClientProvider, createQuery } from "@web-core/query";
import { createGraphQLClient, gql } from "@web-core/query/graphql";

const queryClient = new QueryClient();
const presetsApi = createGraphQLClient({ url: "http://127.0.0.1:8787/graphql" });

const TAGS_QUERY = gql`
  query ListTags {
    presets(kind: "tag") {
      id
      name
    }
  }
`;

function TagsList() {
  const query = createQuery(() => ({
    queryKey: ["tags"],
    queryFn: () =>
      presetsApi.request<{ presets: readonly { id: string; name: string }[] }>(TAGS_QUERY),
  }));
  return (
    <ul>
      <For each={query.data?.presets ?? []}>{(tag) => <li>{tag.name}</li>}</For>
    </ul>
  );
}

export function GraphQLDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <TagsList />
    </QueryClientProvider>
  );
}
```

Бэк не поднят — увидишь `query.isError` (сеть недоступна), а не зависшую загрузку; для проверки
ошибки добавь `<Match when={query.isError}>{String(query.error)}</Match>`.

## 5. REST — живой прогон против публичного тестового API

В репозитории пока нет своего REST-эндпоинта (см. ROADMAP — `REST-транспорт` реализован, но без
реального потребителя). Для проверки `createRestClient` без поднятия своего бэка — публичный
тестовый API (`jsonplaceholder.typicode.com`, не инфраструктура проекта, только для локальной
пробы):

```tsx
import { QueryClient, QueryClientProvider, createQuery } from "@web-core/query";
import { createRestClient } from "@web-core/query/rest";

const queryClient = new QueryClient();
const api = createRestClient({ baseUrl: "https://jsonplaceholder.typicode.com" });

function Post() {
  const query = createQuery(() => ({
    queryKey: ["post", 1],
    queryFn: () => api.request<{ title: string }>("/posts/1"),
  }));
  return <p>{query.isPending ? "грузим…" : query.data?.title}</p>;
}

export function RestDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <Post />
    </QueryClientProvider>
  );
}
```

## 6. Devtools

Панель прямо над любым из демо выше — показывает реальные запросы/кэш, не только тот, что в примере:

```tsx
import { SolidQueryDevtools } from "@web-core/query/devtools";

export function DevtoolsDemo() {
  return import.meta.env.DEV ? <SolidQueryDevtools initialIsOpen /> : null;
}
```

## 7. Persist — кэш переживает перезагрузку страницы

Повесь рядом с любым `queryClient` из примеров выше — обнови страницу и данные подтянутся из
`localStorage` до первого реального фетча:

```ts
import { QueryClient } from "@web-core/query";
import { createSyncStoragePersister, persistQueryClient } from "@web-core/query/persist";

const queryClient = new QueryClient();
persistQueryClient({
  queryClient,
  persister: createSyncStoragePersister({ storage: window.localStorage }),
});
```

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { DefineQueryDemo } from "..."; // любой пример выше

export function LabPage() {
  return <DefineQueryDemo />;
}
```
