# ❓ FAQ

Короткие ответы на конкретные вопросы, которые уже возникали по этому пакету. Не общая
документация (она в [`README.md`](./README.md)) и не план (он в [`ROADMAP.yaml`](./ROADMAP.yaml))
— только факты, каждый проверен либо чтением исходников `@tanstack/solid-query`/`solid-js` в
`node_modules`, либо прямым прогоном.

---

## Solid-адаптер

### Почему опции `createQuery` обязаны быть функцией, если тип называется `UndefinedInitialDataOptions`, а не `Accessor<...>`?

**Коротко: имя типа прячет это — сам тип объявлен как `Accessor<...>` под другим именем, и ошибка компилятора на голом объекте не подсказывает причину прямо.**

`UndefinedInitialDataOptions`/`DefinedInitialDataOptions` (`@tanstack/solid-query/src/queryOptions.ts`)
объявлены буквально как `Accessor<QueryOptions<...> & {...}>` — тип из `solid-js`, то есть
функция без аргументов. `useQuery` (`src/useQuery.ts`) сразу вызывает `options()` внутри
`createMemo(() => options())`. Голый объект на месте параметра либо не пройдёт тайпчек (он не
вызываем), либо, если TS всё же пропустит благодаря структурной типизации подходящей формы,
`options()` в рантайме упадёт как вызов не-функции — что в обоих случаях не объясняет причину
человеку, потому что имя типа не содержит слова `Accessor`.

Проверено чтением `@tanstack/solid-query@5.102.8/src/queryOptions.ts` и `src/useQuery.ts`
(2026-09-04).

---

### Почему результат `createQuery` нельзя деструктурировать (`const { data } = query`)?

**Коротко: результат — `Proxy` над Solid-стором (`createStore`), а не обычный объект; доступ по
свойству — единственный путь, которым Solid отслеживает изменение.**

`useBaseQuery` (`src/useBaseQuery.ts`) хранит состояние в `createStore` (`solid-js/store`) и
возвращает `new Proxy(state, handler)`, где `handler.get` дополнительно перехватывает `data` —
для него значение читается не из стора напрямую, а из `createResource` (`queryResource`), под
которым лежит асинхронная загрузка. Деструктуризация (`const { data } = query`) читает оба поля
ОДИН раз в момент вызова, не оборачивает чтение в реактивный geттер — Solid не видит, что `data`
вообще было прочитано, и не пересчитывает потребителя при следующем обновлении.

Проверено чтением `src/useBaseQuery.ts`, функция `createDeepSignal`/`handler.get` (2026-09-04).

---

### Почему `create*` (`createQuery`, `createMutation`, …) — не просто типовые алиасы, а буквально та же функция, что и `use*`?

**Коротко: `export const createQuery = useQuery` — присваивание переменной, не отдельная
реализация и не только тип; в рантайме это один и тот же объект функции.**

`@tanstack/solid-query/src/index.ts` объявляет каждый `create*` через `export const createX = useX`
рядом с реэкспортом самого `useX`. Разницы в поведении нет по построению, не только по контракту
типов — `createQuery === useQuery` (`===`, не просто совместимые сигнатуры).

Проверено чтением `src/index.ts` (2026-09-04).

---

## Структура пакета

### Почему корневой `src/index.ts` не несёт логику сам, а только реэкспортирует `engine/`?

**Коротко: по образцу `packages/store`/`packages/assembly` — «поверхность пакета» отдельно от
реализации.**

`src/index.ts` — один `export * from "./engine/index.js"` с комментарием сверху. Вся логика (сам
реэкспорт `@tanstack/solid-query` вместе с объяснением, почему он полный) — в
`src/engine/index.ts`. `dist/index.d.ts` после сборки — тоже один реэкспорт, все типы протянуты
насквозь.

---

### Почему `./devtools` и `./persist` — отдельные папки (`src/devtools/index.ts`,
`src/persist/index.ts`), а не файлы прямо в `src/`, как было раньше?

**Коротко: по образцу `@web-core/store`'s `./machine` — самостоятельный подпуть без внутренней
семьи получает свою папку; в отличие от store'вских `./persist`/`./undo`/`./reset`/`./validate`,
у которых общий смысл «аддон `.with()`» оправдывает один `addons/`-каталог на четверых, у query
`devtools` и `persist` не связаны друг с другом ничем, кроме общего вендора TanStack — разной
природы подпути, разные папки.**

Смена коснулась только `package.json` `exports` (пути `dist/devtools.js` →
`dist/devtools/index.js`, аналогично `persist`) — публичные имена подпутей (`./devtools`,
`./persist`) не менялись, содержимое файлов тоже.

---

### Почему `@tanstack/solid-query` объявлен зависимостью (`dependencies`), а не `peerDependencies`, хотя `solid-js` — peer?

**Коротко: приложение никогда не импортирует `@tanstack/solid-query` напрямую (в отличие от
`solid-js`, который держит и приложение, и этот пакет, и другие пакеты web-core одновременно) —
версия вендора целиком наша забота, прятать её от потребителя безопасно.**

`solid-js` обязан быть ровно ОДНИМ экземпляром на всё приложение (реактивность держится на общем
модуле) — поэтому он peer, версию выбирает приложение. `@tanstack/solid-query` достаётся
исключительно через `@web-core/query`, второй копии взяться неоткуда — значит колебание его
версии между релизами этого пакета не бьёт по потребителю, и держать его обычной зависимостью
безопасно.

---

## Devtools

### Vendor уже прячет `SolidQueryDevtools` в проде сам (`isDev`) — зачем README всё равно просит оборачивать импорт в `import.meta.env.DEV`?

**Коротко: самозащита есть, но она не про размер бандла — `import.meta.env.DEV` на стороне
приложения нужен, чтобы Vite вообще не включал код девтулов (и его чанк) в прод-сборку, а не
только чтобы компонент не отрисовался.**

`@tanstack/solid-query-devtools/src/index.tsx`: `SolidQueryDevtools = isDev ? clientOnly(() => import('./devtools')) : function() { return null }`. `isDev` берётся из `solid-js/web` —
константа, буквально `true`/`false`, выбранная package.json`exports`'ом самого `solid-js/web` по
условию `development` (`dist/dev.js` → `isDev = true`, дефолтная ветка `dist/web.js` → `isDev = false`, сверено 2026-09-04). Vite подставляет условие `development` только в дев-сервере — в
проде резолвится `web.js`, и компонент правда становится no-op сам по себе, без участия этого
пакета.

Но это не отменяет совет: `isDev` решает только что ОТРИСУЕТСЯ, а не что ПОПАДЁТ В БАНДЛ — сам
модуль `./devtools` (и код `clientOnly`) остаётся частью графа импортов, пока приложение его
статически импортирует, вне зависимости от значения `isDev`. `import.meta.env.DEV` на стороне
приложения — единственный способ, которым Vite может исключить сам импорт целиком (dead code
elimination на уровне statically known constant, не на уровне значения экспортированной
переменной).

---

## Persist

### Почему `createSyncStoragePersister` — единственный именованный реэкспорт из
`@tanstack/query-sync-storage-persister`, хотя `persist.ts` реэкспортирует `@tanstack/query-persist-client-core` через `export *`?

**Коротко: `@tanstack/query-sync-storage-persister`'s `src/index.ts` и сам экспортирует ровно одну
функцию — звёздочка и точечный реэкспорт здесь дают одинаковый список имён, разница в записи, не
в поверхности.**

---

### `createSyncStoragePersister` помечен `@deprecated` в самом вендоре — почему пакет всё равно строит `./persist` вокруг него?

**Коротко: факт подтверждён чтением исходника, не домысел — `@tanstack/query-sync-storage-persister@5.102.8/src/index.ts` несёт JSDoc `@deprecated use createAsyncStoragePersister from @tanstack/query-async-storage-persister instead`. Решение сохранить `createSyncStoragePersister`
сегодня — синхронный `localStorage`-путь достаточен для того, что реально используется в
web-core сейчас, а `@tanstack/query-async-storage-persister` не установлен ни в одной зависимости
репозитория. Открытый пункт — в `ROADMAP.yaml`, «Не сделано».**

Проверено чтением `@tanstack/query-sync-storage-persister@5.102.8/src/index.ts`, JSDoc над
`createSyncStoragePersister` (2026-09-04).
