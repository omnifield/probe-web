# ⚙️ web-core Router

🏷️ routing · 🧬 engine · 📦 `@web-core/router`

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

🧭 Роутинг web-core поверх `@tanstack/solid-router` — единственная точка резолва вместо вендора.
Приложение импортирует ровно этот пакет, никогда `@tanstack/solid-router` напрямую: тогда
`RouterProvider`/хуки во всех файлах ловят один и тот же модуль-синглтон, а не две копии из-за
двух разных спецификаторов импорта. 🛠️ Средство, а не решение — пакет не приносит
своей разметки поверх вендора (в отличие от `@web-core/ui`, у которой есть что прятать и
добавлять): вся задача здесь — быть единственным путём резолва, плюс вкус дефолтов и готовый
vite-плагин с верным порядком в массиве.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-анатомии — «часть» здесь означает подпуть поставки. Три подпути: рантайм
роутера (полный реэкспорт вендора + дефолты), vite-плагин файловой маршрутизации, девтулы отдельной
дверью, чтобы не тянуться в прод случайно.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Рантайм роутера | `@web-core/router` | весь `@tanstack/solid-router` (`RouterProvider`, `createRouter`, `createRootRoute`, `createRoute`, `createFileRoute`, `Link`, `Outlet`, `useNavigate`, `useParams`, `useSearch`, `useLoaderData`, `useRouteContext`, `getRouteApi`, `createMemoryHistory`, … ~80 экспортов) + `defaultRouterOptions` |
| Vite-плагин | `@web-core/router/vite` | `tanstackRouterVitePlugin`, `TanstackRouterVitePluginOptions` |
| Девтулы | `@web-core/router/devtools` | `TanStackRouterDevtools` |

📦 Внутри пакета: `src/index.ts` — единственный файл в корне `src/`, тонкая поверхность (один
реэкспорт `engine/`). Каждый подпуть — своя папка: `src/engine/index.ts` (реэкспорт вендора +
`defaultRouterOptions`), `src/vite/index.ts` (`tanstackRouterVitePlugin`), `src/devtools/index.ts`
(реэкспорт девтул) — по форме `@web-core/store` (`index.ts` + `engine/` + `machine/` + `addons/`)
и `@web-core/assembly` (`index.ts` + `engine/` + `render/` + `shared/`).

<h2 id="использование">🚀 Использование</h2>

Три точки, которыми пакет входит в приложение: вайринг сборки, объявление роутера, файлы
маршрутов. Подробный пошаговый рецепт — в разделе «Рецепт».

**Файловый маршрут с параметром и загрузкой данных:**

```tsx
import { createFileRoute } from "@web-core/router";

export const Route = createFileRoute("/posts/$postId")({
  loader: ({ params }) => fetchPost(params.postId),
  component: () => {
    const post = Route.useLoaderData(); // Accessor<Post> — вызывать как функцию: post()
    return <h1>{post().title}</h1>;
  },
});
```

**Код-based маршрут без файлового генератора:**

```ts
import { createRootRoute, createRoute } from "@web-core/router";

const rootRoute = createRootRoute({ component: () => <Outlet /> });
const aboutRoute = createRoute({ getParentRoute: () => rootRoute, path: "/about", component: About });
const routeTree = rootRoute.addChildren([aboutRoute]);
```

**Девтулы, обёрнутые в `import.meta.env.DEV`:**

```tsx
import { TanStackRouterDevtools } from "@web-core/router/devtools";

{import.meta.env.DEV && <TanStackRouterDevtools />}
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 Две группы настроек: дефолты роутера (объект, не функция) и опции vite-плагина (передаются
как есть вендору, кроме зафиксированного `target`).

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `defaultPreload` | `defaultRouterOptions` | `"intent"` | `"intent"` — подгрузка соседних маршрутов по наведению/фокусу на `<Link>` |
| `defaultPreloadStaleTime` | `defaultRouterOptions` | `number` | `0` — подгруженное протухает мгновенно |
| `scrollRestoration` | `defaultRouterOptions` | `boolean` | `true` |
| `target` | `tanstackRouterVitePlugin(options)` | `"solid"` | зафиксирован, в `options` не принимается |
| `autoCodeSplitting` | `tanstackRouterVitePlugin(options)` | `boolean` | `true` |
| `routesDirectory`/`generatedRouteTree`/… | `tanstackRouterVitePlugin(options)` | весь `Config` вендора кроме `target` | вендорские дефолты (`src/routes/`, `src/routeTree.gen.ts`) |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 У пакета нет своих состояний — он не добавляет логики поверх `@tanstack/solid-router`, только
называет вход. Состояния целиком вендорские: у совпадения маршрута (`RouteMatch`) и у самого
роутера.

| Состояние | Метка | Где |
|---|---|---|
| Маршрут ждёт загрузчик | `status: "pending"` | `RouteMatch`, показывается `pendingComponent` |
| Маршрут загружен | `status: "success"` | `RouteMatch` |
| Загрузчик упал | `status: "error"` | `RouteMatch`, показывается `errorComponent` |
| Маршрут не найден | `status: "notFound"` | `RouteMatch`, показывается `notFoundComponent` |

<h2 id="io">🔌 IO</h2>

Вход и выход — вендорские сигнатуры один в один, пакет их не переопределяет и не оборачивает
(кроме `defaultRouterOptions` — объекта для спреда, не вызова).

<h3 id="io-вход">📥 Вход</h3>

| Конструктор | Принимает |
|---|---|
| `createRouter({ ...defaultRouterOptions, routeTree })` | дерево маршрутов + опции роутера |
| `createFileRoute(path)(options)` | `{ loader?, component?, ... }` |
| `createRoute(options)` | `{ getParentRoute, path, component?, loader?, ... }` |
| `tanstackRouterVitePlugin(options?)` | `Partial<Omit<Config, "target">>` |
| `useParams({ from })`/`useSearch({ from })` | адрес маршрута |

<h3 id="io-выход">📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `useParams`/`useSearch`/`useLoaderData`/`useRouteContext` | акцессор (функция), не готовое значение |
| `useNavigate()` | функцию навигации, вызывается сразу: `navigate({ to: "/about" })` |
| `Route.useLoaderData()` | акцессор `Accessor<T>` данных из `loader` |
| `tanstackRouterVitePlugin()` | `Plugin \| Plugin[]` для массива `plugins` vite-конфига |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Смоук-проба зоны: не «опции разобрались», а настоящий рендер и настоящая навигация — то, что
действительно ловит сломанный реэкспорт или разъехавшийся вендор.

| Сборка | Что доказывает | Файл |
|---|---|---|
| `createRouter` + `RouterProvider` | реальный рендер дерева маршрутов, дефолты (`defaultPreload`) на месте | `test/router.test.tsx` |
| `router.navigate({ to })` | навигация меняет смонтированное дерево (`home` → `about`) | `test/router.test.tsx` |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Полный вайринг приложения — четыре файла, порядок между ними важен там, где отмечено.

```ts
// vite.config.ts — плагин роутера ОБЯЗАН стоять ПЕРЕД vite-plugin-solid (см. FAQ)
import { defineConfig } from "@web-core/build/vite";
import { tanstackRouterVitePlugin } from "@web-core/router/vite";

const config = defineConfig();
export default {
  ...config,
  plugins: [tanstackRouterVitePlugin(), ...(config.plugins ?? [])],
};
```

```ts
// src/router.ts
import { createRouter, defaultRouterOptions } from "@web-core/router";
import { routeTree } from "../routeTree.gen.js"; // порождённый файл, в .gitignore

export const router = createRouter({ ...defaultRouterOptions, routeTree });

// ОБЯЗАТЕЛЬНО — без этого блока пропадает типобезопасность навигации по всему приложению.
declare module "@web-core/router" {
  interface Register {
    router: typeof router;
  }
}
```

```tsx
// src/main.tsx
import { mount } from "@web-core/shared";
import { RouterProvider } from "@web-core/router";
import { router } from "./router.js";

mount(() => <RouterProvider router={router} />);
```

```tsx
// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from "@web-core/router";
import { TanStackRouterDevtools } from "@web-core/router/devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <nav><Link to="/">Home</Link><Link to="/about">About</Link></nav>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
  notFoundComponent: () => <p>Страница не найдена</p>,
});
```

✨ `src/routes/` — обычные файлы (`index.tsx` → `/`, `about.tsx` → `/about`,
`posts/$postId.tsx` → `/posts/:postId`, `_auth.tsx` — pathless layout). `routeTree.gen.ts` пишет
сам плагин при каждом старте dev-сервера/сборке.
