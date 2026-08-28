# @omnifield/probe-web-router

Роутинг probe-web поверх `@tanstack/solid-router`. Приложение импортирует ровно этот пакет —
никогда `@tanstack/solid-router` напрямую, — чтобы `RouterProvider`/хуки во всех файлах ловили
один и тот же модуль-синглтон, а не две копии из-за двух разных спецификаторов импорта.

Три подпутя:

- `.` — реэкспорт всего рантайма роутера (`RouterProvider`, `createRouter`, `createFileRoute`,
  `Link`, `Outlet`, `useNavigate`, `useParams`, `useSearch`, …) плюс `defaultRouterOptions`.
- `./vite` — готовый vite-плагин файловой маршрутизации, `target: "solid"` уже назван.
- `./devtools` — `TanStackRouterDevtools`, отдельно от `.`, чтобы не тянуться в прод случайно.

Почему здесь ПОЛНЫЙ реэкспорт, а не отбор по имени, как у `ui`/`build`: у `ui` есть своя
разметка поверх kobalte — есть что прятать и добавлять. У роутинга своей разметки нет, вся
задача пакета — быть единственным путём резолва. Ручная выборка из ~80 экспортов только
развела бы дрейф: TanStack допишет хук минорным выпуском — мы забудем прокинуть его сюда.

## Установка в приложении

```jsonc
// package.json приложения
"dependencies": {
  "@omnifield/probe-web-router": "workspace:*",
  "@tanstack/solid-router": "^1.170.30" // тот же peer, что просит пакет — версию держит приложение
}
```

`@tanstack/solid-router` — **peer**, не транзитивная зависимость: сгенерированный
`routeTree.gen.ts` пишет `import { createFileRoute } from "@omnifield/probe-web-router"` сам
(см. `routeImportPath`/шаблон ниже), но резолвится это через строгий pnpm только если пакет
стоит и у приложения тоже.

## Вайринг: `vite.config.ts`

`defineConfig()` зоны `build` кладёт `vite-plugin-solid` ПЕРВЫМ и своей точки расширения
«перед» не даёт (её `options.plugins` — это «после»). А `@tanstack/router-plugin` обязан
стоять ПЕРЕД solid-плагином (иначе падает при `autoCodeSplitting`, сверено 2026-08-28). Поэтому
готовый конфиг собирается вручную, а не через `options.plugins`:

```ts
// vite.config.ts
import { defineConfig } from "@omnifield/probe-web-build/vite";
import { tanstackRouterVitePlugin } from "@omnifield/probe-web-router/vite";

const config = defineConfig();

export default {
  ...config,
  plugins: [tanstackRouterVitePlugin(), ...(config.plugins ?? [])],
};
```

По умолчанию генератор ждёт маршруты в `src/routes/` и пишет `src/routeTree.gen.ts` — как и
везде у TanStack, менять не обязательно. `routeTree.gen.ts` — порождённый файл, в `.gitignore`.

## Вайринг: `src/router.ts`

```ts
import { createRouter, defaultRouterOptions } from "@omnifield/probe-web-router";

import { routeTree } from "../routeTree.gen.js";

export const router = createRouter({ ...defaultRouterOptions, routeTree });

// ОБЯЗАТЕЛЬНО — без этого блока пропадает типобезопасность навигации по всему приложению.
declare module "@omnifield/probe-web-router" {
  interface Register {
    router: typeof router;
  }
}
```

`defaultRouterOptions` — объект (`defaultPreload: "intent"`, `defaultPreloadStaleTime: 0`,
`scrollRestoration: true`), не функция-обёртка. `createRouter()` — точка, где TypeScript
выводит тип дерева маршрутов из аргумента и привязывает его к `Register`; обёртка эту связь
рвёт (сверено: `TanStack/router#1943` — контекст-типизация ломалась именно на обёрнутом
вызове). Поэтому дефолты — только объект для спреда, вызов `createRouter` — приложения.

## Вайринг: `src/main.tsx`

Замороженная точка монтирования не меняется (`@omnifield/probe-web-runtime`, `PROBEWEB-4`) —
роутер просто становится корневым компонентом:

```tsx
import "@omnifield/probe-web-style/base.css";

import { mount } from "@omnifield/probe-web-runtime";
import { RouterProvider } from "@omnifield/probe-web-router";

import { router } from "./router.js";

mount(() => <RouterProvider router={router} />);
```

## Файлы маршрутов

```
src/routes/
  __root.tsx     — общий layout, Outlet + навигация + девтулы
  index.tsx      — "/"
  about.tsx      — "/about"
  posts/
    index.tsx    — "/posts"
    $postId.tsx  — "/posts/:postId"
  _auth.tsx      — pathless layout (префикс "_" — оборачивает детей, в URL не входит)
```

```tsx
// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from "@omnifield/probe-web-router";
import { TanStackRouterDevtools } from "@omnifield/probe-web-router/devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <nav>
        <Link to="/" activeProps={{ class: "active" }}>Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Outlet />
      {/* `import.meta.env.DEV` — статическая константа сборки: Vite подставляет `false` в
          проде и вырезает ветку целиком, отдельный dynamic import не нужен. */}
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
  notFoundComponent: () => <p>Страница не найдена</p>,
});
```

```tsx
// src/routes/posts/$postId.tsx — параметр, загрузка данных, доступ к ним
import { createFileRoute } from "@omnifield/probe-web-router";

export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params }) => fetchPost(params.postId),
  component: () => {
    const post = Route.useLoaderData(); // Accessor<Post> — вызывать как функцию: post()
    return <h1>{post().title}</h1>;
  },
});
```

## Хуки — Solid, не React: акцессоры, не значения

`useParams`, `useSearch`, `useLoaderData`, `useRouteContext` в Solid-адаптере возвращают
**акцессоры** (функции), а не готовые значения — то же тонкозернистое устройство, что у любого
Solid-сигнала: `const params = useParams({ from: "/posts/$postId" }); params().postId`, не
`params.postId`. `useNavigate()` — не акцессор, а сразу функция навигации:
`const navigate = useNavigate(); navigate({ to: "/about" })`.

Внутри уже смонтированного файла маршрута код-сплиттинга (`autoCodeSplitting: true`) типы
`from` подставлять не обязательно — их знает сам `Route.useParams()`/`Route.useSearch()`.
Для общих компонентов вне маршрута — `getRouteApi("/posts/$postId")`, чтобы не писать
`from` в каждом хуке руками.

## Код-based маршруты вместо файловых

Не обязательно: `createRootRoute`/`createRoute`/`rootRoute.addChildren([...])` работают без
`./vite`-плагина вовсе — тогда `routeTree` собирается вручную, а не порождается. Для одного-двух
экранов (как у `products/tables/src/playground/route.ts`, который свой самодельный роутер
завёл ИМЕННО из-за этого) это может быть дешевле; на файловую маршрутизацию стоит переходить,
когда экранов и вложенности становится достаточно, чтобы ручное дерево стало неудобным.
