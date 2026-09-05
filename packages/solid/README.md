# 🧬 web-core Solid

🏷️ framework · 🧬 engine · 📦 `@web-core/solid`

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

🧬 Solid.js web-core — единственная точка резолва вместо вендора, тем же приёмом, что
`@web-core/router` для `@tanstack/solid-router`. Зона импортирует ровно этот пакет, никогда
`solid-js`/`solid-js/web` напрямую — тогда `createSignal`/`onMount`/`render` во всех файлах ловят
один и тот же модуль-синглтон, а версию решает architect в одном месте, а не 20 `package.json`
по репозиторию. 🛠️ Средство, а не решение: сам по себе пакет не приносит своего вида, только
резолв — ПЛЮС собственные добавления поверх (первое — `mountApp()`/`#root`, точка входа
приложения, у самого Solid её нет).

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-анатомии — «часть» здесь означает подпуть поставки. Два подпути зеркалят
вход `solid-js` и `solid-js/web` дословно; третий — собственное добавление пакета, которого у
вендора нет вовсе.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Реактивное ядро | `@web-core/solid` | весь `solid-js` (`createSignal`, `createEffect`, `createMemo`, `onMount`, `onCleanup`, `createUniqueId`, JSX-типы, …) |
| DOM-рендер | `@web-core/solid/web` | весь `solid-js/web` (`render`, `Portal`, `hydrate`, …) |
| Точка монтирования | `@web-core/solid/mount` | `mountApp(root)` — СОБСТВЕННОЕ добавление, не из вендора |

📦 Внутри пакета: `src/index.ts` — единственный файл в корне `src/`, тонкая поверхность (один
реэкспорт `engine/`). Каждый подпуть — своя папка: `src/engine/index.ts` (`export * from
"solid-js"`), `src/web/index.ts` (`export * from "solid-js/web"`), `src/mount/index.ts`
(`mountApp`) — по форме `@web-core/router` (`index.ts` + `engine/` + `vite/` + `devtools/`).

<h2 id="использование">🚀 Использование</h2>

**Реактивное ядро** — импорт один в один с `solid-js`, другим спецификатором:

```ts
import { createSignal, onCleanup, onMount } from "@web-core/solid";

const [count, setCount] = createSignal(0);
onMount(() => console.log("mounted"));
```

**DOM-рендер** — нужен редко напрямую (обычно закрыт `mountApp`), но доступен как есть:

```ts
import { render } from "@web-core/solid/web";
```

**Точка монтирования** (`main.tsx` потребителя, `placed-once` — кладётся один раз и не
обновляется):

```tsx
import { mountApp } from "@web-core/solid/mount";

mountApp(() => <App />);
```

```html
<!-- index.html потребителя -->
<div id="root"></div>
```

<h2 id="настройки">🎚️ Настройки</h2>

🎚️ У реэкспорта настроек нет — это вендорская поверхность как есть. У `mountApp()` одна: сам
корневой компонент.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `root` | `mountApp(root)` | `() => JSX.Element` | обязательное |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Реактивное ядро и DOM-рендер — вендорские состояния как есть, пакет их не меняет. У
`mountApp()` три состояния, все вокруг `#root`.

| Состояние | Метка | Где |
|---|---|---|
| Первый вызов `mountApp()` на `#root` | записи в `mounted` не было | `src/mount/index.ts` |
| Повторный вызов `mountApp()` на том же `#root` (HMR, рестарт) | прежний `dispose` вызван до нового `render` | `src/mount/index.ts` |
| `#root` не найден | брошен `Error` с текстом, куда добавить `<div id="root">` | `src/mount/index.ts` |

<h2 id="io">🔌 IO</h2>

Вход и выход реактивного ядра/DOM-рендера — вендорские сигнатуры один в один, пакет их не
переопределяет.

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `mountApp(root)` | `() => JSX.Element` — корневой компонент |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `mountApp` | `void` — `dispose` наружу не отдаётся, держит его сама функция (`WeakMap`) |

<h2 id="сборки">🏗️ Сборки</h2>

⚠️ Автоматических проб сегодня нет — пакет только что заведён, `test/` ещё не написан. Ниже —
что фактически проверено ✅ вручную.

| Проверено | Как | Результат |
|---|---|---|
| Три подпути собираются раздельными файлами `dist/` | `tsc -p tsconfig.build.json` | `dist/{index,engine,web,mount}/…` |
| Барель `.` реэкспортирует `solid-js` целиком | `import()` `dist/index.js` | `createSignal`/`onMount`/… — все на месте |
| `./web` реэкспортирует `solid-js/web` целиком | `import()` `dist/web/index.js` | `render`/`Portal`/… — все на месте |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 `main.tsx` потребителя — единственная точка сборки, где `mountApp()` реально зовётся:

```tsx
// src/main.tsx
import { mountApp } from "@web-core/solid/mount";
import { QueryClient, QueryClientProvider } from "@web-core/query";
import { RouterProvider } from "@web-core/router";

import { router } from "./router.js";

const queryClient = new QueryClient();

mountApp(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
));
```

Остальные зоны кита сегодня продолжают импортировать `solid-js`/`solid-js/web` напрямую — переезд
на `@web-core/solid` идёт по мере того, как architect решает добавить сюда очередную вещь (см.
ROADMAP.yaml, `id: migrate-direct-solid-imports`), не одним разовым рефакторингом всего кита.
