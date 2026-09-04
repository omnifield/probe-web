# 🛠️ web-core build

🏷️ tooling · 🧬 engine · 📦 `@web-core/build`

Оснастка сборки web-core — используйте, если заводите новое приложение/библиотеку/сервер в
этом репозитории и не хотите сами подбирать версию Vite, набор плагинов Solid или условия
разрешения тестов. Пять точек поверхности закрывают весь цикл: конфиг приложения и конфиг
библиотеки (`/vite`), пресет тестов (`/vitest`), два профиля типов — для фронтенда и для
сервера без Vite (`/tsconfig`, `/tsconfig-node`) — и TS-раннер серверов (`web-core-node`).
Рантайм-кода в пакете нет ни строки: он не едет в бандл потребителя, только конфигурирует его
сборку.

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="анатомия">🧩 Анатомия</h2>

У движка нет DOM-узлов — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор
(или имя бинарника), которым эта часть достаётся.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Конфиг приложения и библиотеки | `@web-core/build/vite` | `defineConfig`, `defineLibraryConfig` |
| Пресет тест-раннера | `@web-core/build/vitest` | `defineTestConfig` |
| Профиль типов — фронтенд | `@web-core/build/tsconfig` | JSON, только `extends` |
| Профиль типов — сервер без Vite | `@web-core/build/tsconfig-node` | JSON, только `extends` |
| TS-раннер серверов | бинарник `web-core-node` | CLI (`web-core-node <файл>`, `web-core-node watch <файл>`) |

Внутри пакета: `src/vite/` (`index.ts` — фабрики конфига, `workspace-source.ts` — поиск
соседей по воркспейсу), `src/vitest/index.ts`, `src/tsconfig/base.json`, `src/node/`
(`base.json` + бинарник `bin.mjs`), `src/shared/` (perf-трейсы и строгие проверки типов, общие
для обоих tsconfig-профилей). Сборка копирует JSON-конфиги и бинарник в `dist/` тем же
раскладом — это то, что реально уезжает потребителю (`files` манифеста: только `dist` и этот
`README.md`).

<h2 id="использование">🚀 Использование</h2>

**Конфиг приложения:**

```ts
// vite.config.ts потребителя
import { defineConfig } from "@web-core/build/vite";
export default defineConfig();
```

**Конфиг библиотеки** (`ui`, `skin`, `assembly` и подобные зоны — вместо собственного
`scripts/build.mjs` поверх esbuild):

```ts
// vite.config.ts потребителя-библиотеки
import { defineLibraryConfig } from "@web-core/build/vite";
export default defineLibraryConfig({
  entries: [{ name: "index", source: "src/index.ts", solid: true }],
});
```

```jsonc
// package.json потребителя-библиотеки
"build": "vite build && tsc -p tsconfig.build.json"
```

**Пресет тестов:**

```ts
// vitest.config.ts потребителя
import { defineTestConfig } from "@web-core/build/vitest";
export default defineTestConfig();
```

**Профиль типов — фронтенд:**

```jsonc
// tsconfig.json потребителя
{
  "extends": "@web-core/build/tsconfig",
  "include": ["src", "vite.config.ts"]
}
```

**Профиль типов и раннер — сервер без Vite:**

```jsonc
// tsconfig.json серверного потребителя
{
  "extends": "@web-core/build/tsconfig-node",
  "include": ["src"]
}
```

```jsonc
// package.json серверного потребителя
{
  "scripts": {
    "start": "web-core-node src/server.ts",
    "dev": "web-core-node watch src/server.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

Бинарник `web-core-node` потребитель получает через `pnpm`-симлинк `bin` прямой зависимости —
`tsx` тащить в свои зависимости не нужно, он обычная зависимость самого `build`.

<h2 id="настройки">🎚️ Настройки</h2>

У движка нет одной сущности с общим списком настроек — опции у каждой фабрики свои: `vite.config.ts`
принимает то, что вывести неоткуда, `defineLibraryConfig` — состав поставки, tsconfig-профили и
раннер настроек не принимают вовсе (профиль — готовый JSON, раннер читает только CLI-аргументы,
которые пробрасывает `tsx`).

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `base` | `defineConfig`, `options.base` | `string` | не задан |
| `proxy` | `defineConfig`, `options.proxy` | конфиг прокси дев-сервера Vite | не задан |
| `plugins` | `defineConfig`, `options.plugins` | `Plugin[]` | `[]` |
| `entries` | `defineLibraryConfig`, `options.entries` | `LibraryEntry[]` (`name`, `source`, `solid?`) | обязательное |
| Трейсы | глобальный флаг | `globalThis.__WEB_CORE_BUILD_TRACE__: boolean` | `false` |

<h2 id="состояния">🎛️ Состояния</h2>

Настоящих runtime-состояний у статичных фабрик нет — есть режимы, в которых плагины Vite ведут
себя по-разному, и переключатель трейсов.

| Состояние | Метка | Где |
|---|---|---|
| Дев-режим — сосед виден исходником | сработал `resolve.alias` | `/vite`, `apply: "serve"` |
| Дев-режим — CSS соседа порождён функцией | `resolveId`+`load` вернули результат | `/vite`, `generatedCssPlugin` |
| Дев-режим — CSS соседа остался файлом с диска | `load` вернул `undefined` | `/vite`, нет функции в `./generate` |
| Сборка — ничего не подменяется | оба дев-плагина `apply: "serve"`, в билде не участвуют | `/vite` |
| Трейсы включены | `globalThis.__WEB_CORE_BUILD_TRACE__ === true` | `src/shared/trace.ts` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Фабрика | Принимает |
|---|---|
| `defineConfig(options?)` | `DefineConfigOptions` (`base?`, `proxy?`, `plugins?`) |
| `defineTestConfig()` | ничего |
| `defineLibraryConfig(options)` | `DefineLibraryConfigOptions` (`entries: LibraryEntry[]`) |
| `web-core-node <файл>` / `watch <файл>` | путь к `.ts`-входу, аргументы пробрасываются `tsx` как есть |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `defineConfig` | `UserConfig` Vite — для `export default` в `vite.config.ts` |
| `defineTestConfig` | `UserConfig` (с полем `test`) — для `export default` в `vitest.config.ts` |
| `defineLibraryConfig` | `UserConfig` в library mode; для входов с `solid: true` `closeBundle` дописывает `dist/<name>.jsx` рядом |
| `/tsconfig`, `/tsconfig-node` | готовый JSON для `extends` в `tsconfig.json` потребителя |
| `web-core-node` | исполняет файл процессом `tsx`, ничего не возвращает вызывающему |

<h2 id="сборки">🏗️ Сборки</h2>

Автоматических проб сегодня нет — `test/` зоны был снесён попутным коммитом, восстановление в
бэклоге (`ROADMAP.yaml`, `id: rebuild-test-suite`). Ниже — что фактически проверено вручную
(build/typecheck/tarball/дев-сервер настоящего потребителя) в рамках последней ревизии.

| Проверено | Как | Результат |
|---|---|---|
| `defineConfig` в реальном приложении | `apps/reference`, настоящий дев-сервер, HTTP-запрос к `/` и `/src/main.tsx` | `200`, без ошибок в консоли |
| Соседи по воркспейсу видны исходником | тот же прогон `apps/reference` (пакеты кита — соседи) | дев-сервер поднимается, HMR не падает |
| `defineConfig`/`defineTestConfig` экспортируются | `import()` собранного `dist/vite/index.js` и `dist/vitest/index.js` | обе функции — `function` |
| `web-core-node` исполняет `.ts` | ручной прогон на тестовом файле | вывод программы, без ошибок загрузчика |
| `/tsconfig`, `/tsconfig-node` резолвят `extends` | `tsc --noEmit` на файле, наследующем каждый профиль из `dist/` | оба прохода зелёные |
| Тарбол не тащит лишнего | `pnpm pack`, разбор содержимого архива | только `dist` + корневой `README.md` |

<h2 id="рецепт">🎨 Рецепт</h2>

Съёмный слой поверх `/vite` — `options.plugins` в `defineConfig`: довесок сверх пресетных
плагинов, для того немногого, что пресет предсказать не может (дев-only статус-роут, прокси
особого вида).

```ts
import { defineConfig } from "@web-core/build/vite";

export default defineConfig({
  plugins: [
    {
      name: "dev-status-route",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/__status", (_req, res) => res.end("ok"));
      },
    },
  ],
});
```
