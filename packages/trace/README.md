# ⏱️ web-core Trace

🏷️ diagnostics · 🧬 engine · 📦 `@web-core/trace`

## 🧭 Навигация

- ✨ [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">✨ Главное</h2>

⏱️ Движок perf-трейсов для всех зон web-core — используйте, если зоне нужен свой замер времени и
свой лог без ручного протаскивания `performance.now()` и `console.debug` в каждое место. 🧬
Устроен тем же приёмом, что и `@web-core/style` — **ядро без фреймворка** (`.`) плюс
**необязательный Solid-плагин** отдельным подпутём (`./solid`), а не одним файлом со смешанной
зависимостью. 🪶 Небольшой сегодня — одно ядро, один переключатель, три формы использования
(замер, разовая пометка, декларативный тумблер зон) — но полноценный движок по форме, не заготовка
и не часть чужого пакета.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Ядро | `@web-core/trace` | `createTracer(zone)`, `createNoter(zone)`, `isEnabled(zone)`, `setEnabled(zone, value)` |
| Solid-плагин | `@web-core/trace/solid` | `createLifeTracer(zone)`, `TraceProvider` |

📂 `src/engine.ts` — реализация ядра, ноль зависимостей. `src/index.ts` — тонкий барель
(`export * from "./engine.js"`), тот же приём, что `src/index.ts` у `@web-core/style` (барель
поверх `src/engine/`). `src/solid.ts` — единственный файл пакета, который трогает `solid-js`
(`onCleanup`, `createUniqueId`, `onMount`); импортирует `isEnabled`/`setEnabled` из `engine.ts`,
не считает флаг заново.

<h2 id="использование">🚀 Использование</h2>

**Ядро** — своя тонкая обёртка на каждую зовущую зону, один и тот же приём:

```ts
// src/shared/trace.ts зоны-потребителя
import { createNoter, createTracer } from "@web-core/trace";

export const trace = createTracer("my-zone"); // флаг __WEB_CORE_MY_ZONE_TRACE__
export const note = createNoter("my-zone");
```

```ts
const done = trace("render");
// … работа …
done(); // [web-core-my-zone] render — 1.83ms

note("кэш промахнулся"); // [web-core-my-zone] кэш промахнулся
```

**Solid-плагин** — лог на монтирование и на `onCleanup` Solid-компонента:

```ts
import { createLifeTracer } from "@web-core/trace/solid";

const traceLife = createLifeTracer("ui");

function MyWidget() {
  traceLife("MyWidget");
  return <div />;
}
```

**`TraceProvider`** — включает зоны на время жизни поддерева, тем же местом в дереве, что и
`QueryClientProvider`:

```tsx
import { TraceProvider } from "@web-core/trace/solid";

<TraceProvider zones={["assembly", "ui"]}>
  <App />
</TraceProvider>;
```

<h2 id="настройки">🎚️ Настройки</h2>

🎛️ Одна настройка на все фабрики — имя зоны, и один переключатель на зону — глобальный флаг.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `zone` | `createTracer`/`createNoter`/`createLifeTracer`, аргумент фабрики | `string` | обязательное |
| Трейсы зоны | глобальный флаг | `globalThis.__WEB_CORE_<ZONE>_TRACE__: boolean` | `false` |
| `zones` | `TraceProvider`, проп | `string[]` | обязательное |

<h2 id="состояния">🎛️ Состояния</h2>

🩺 Одно состояние — включённость трейсера зоны, читается тем же флагом всеми фабриками.

| Состояние | Метка | Где |
|---|---|---|
| Трейсы зоны включены | `globalThis.__WEB_CORE_<ZONE>_TRACE__ === true` | `src/engine.ts`, `isEnabled` |
| Трейсы зоны выключены (по умолчанию) | флаг не выставлен | `src/engine.ts`, `isEnabled` |
| `TraceProvider` смонтирован | зоны из `props.zones` включены | `src/solid.ts`, `onMount` |
| `TraceProvider` размонтирован | те же зоны выключены | `src/solid.ts`, `onCleanup` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Фабрика | Принимает |
|---|---|
| `createTracer(zone)` | `string` — имя зовущей зоны |
| `createNoter(zone)` | `string` — имя зовущей зоны |
| `createLifeTracer(zone)` | `string` — имя зовущей зоны |
| `isEnabled(zone)` | `string` — имя зовущей зоны |
| `setEnabled(zone, value)` | `string`, `boolean` |
| `TraceProvider` | `zones: string[]`, `children: JSX.Element` |
| Трейсер, возвращённый `createTracer` | `label: string` — имя замеряемого участка |
| Ноутер, возвращённый `createNoter` | `message: string` — текст пометки |
| Лайфсайкл-трейсер, возвращённый `createLifeTracer` | `node: string` — имя Solid-узла |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `createTracer(zone)` | `(label: string) => () => void` — открывает замер, закрытие пишет строку в `console.debug` |
| `createNoter(zone)` | `(message: string) => void` — разовая пометка в лог, без замера |
| `createLifeTracer(zone)` | `(node: string) => void` — лог монтирования сразу, лог снятия через `onCleanup` |
| `isEnabled(zone)` | `boolean` |
| `setEnabled(zone, value)` | `void` |
| `TraceProvider` | `JSX.Element` — рендерит `props.children` как есть, ничего не оборачивает в DOM |

<h2 id="сборки">🏗️ Сборки</h2>

⚠️ Автоматических проб сегодня нет — `test/` в пакете не существовал ни разу (было унаследовано
от прежней истории пакета `@web-core/shared`, из которого этот движок выделен, — задача осталась
открытой: `ROADMAP.yaml`, `id: write-test-suite`). Ниже — что фактически проверено ✅ вручную.

| Проверено | Как | Результат |
|---|---|---|
| Ядро и плагин собираются раздельными файлами `dist/` | `tsc -p tsconfig.build.json` | `dist/{index,engine,solid}.js` |
| Плагин берёт флаг из ядра, а не считает свой | чтение `dist/solid.js` | вызывает `isEnabled`/`setEnabled` из `./engine.js` |
| Барель `.` реэкспортирует ядро целиком | `import()` `dist/index.js` | `createTracer`/`createNoter`/`isEnabled`/`setEnabled` — все `function` |

<h2 id="рецепт">🎨 Рецепт</h2>

🔌 Рецепт — конкретная обёртка зоны-потребителя: фиксирует `zone`, реэкспортирует готовую фабрику,
не переизобретает механику.

```ts
// src/shared/trace.ts зоны "assembly"
import { createNoter, createTracer } from "@web-core/trace";

export const trace = createTracer("assembly");
export const note = createNoter("assembly");
```

Так сделано в `assembly`, `ui` (только `createLifeTracer`), `apps/reference`, `build` и `style` —
шесть тонких обёрток в 1–3 строки, ни одна не хранит собственной логики тумблера, только имя
зоны. `build`/`style` раньше держали свою копию ядра из-за цикла зависимостей при установке —
цикл снят при выделении трейсера из `@web-core/shared` (см. FAQ.md).
