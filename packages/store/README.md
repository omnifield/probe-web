# ⚙️ web-core Store

🏷️ state · 🧬 engine · 📦 `@web-core/store`

Стейт web-core поверх XState-семьи — используйте, если нужно глобальное реактивное хранилище вне
дерева компонентов (без Provider) или явную стейт-машину с guards/вложенными состояниями/
акторами. `@xstate/store` даёт плоский zustand-по-духу слой (`createStore`, атомы), `xstate` —
опциональный слой полных машин поверх него же, одной согласованной семьёй, а не склейкой двух
разных вендоров. Значение, посчитанное синхронно или полученное асинхронно по ключу из службы,
читается одним и тем же приёмом (`createResourceAtom`) — выбирать между разными техниками под
sync/async не нужно.

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

У движка нет DOM-узлов — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор,
которым эта часть достаётся. Плоское хранилище живёт в корне, стейт-машины и каждый аддон —
отдельным подпутём: приложение импортирует ровно то, что реально использует, и ничего сверх.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Плоское хранилище | `@web-core/store` | `createStore`, `createAtom`, `createAtomConfig`, `createReducerAtom`, `createResourceAtom`, `createStoreConfig`, `createStoreLogic`, `shallowEqual`, `useSelector`, `useStore`, `useAtom`, `useAtomState` |
| Стейт-машины | `@web-core/store/machine` | весь `xstate` (`createMachine`, `setup`, `assign`, `fromPromise`, `createActor`, guards, …), `useMachine`, `useActor`, `useActorRef`, `fromActorRef` |
| Persist-аддон | `@web-core/store/persist` | `persist`, `createJSONStorage`, `clearStorage`, `flushStorage`, `isHydrated`, `rehydrateStore`, `createBroadcastStorage`, `subscribeToBroadcastStorage` |
| Undo/redo-аддон | `@web-core/store/undo` | `undoRedo` |
| Reset-аддон | `@web-core/store/reset` | `reset` |
| Validate-аддон | `@web-core/store/validate` | `validateSchemas`, `StoreValidationError` |

Внутри `@web-core/store`: `src/index.ts` (тонкий реэкспорт), `src/engine/index.ts` (реэкспорт
`@xstate/store-solid` + `createResourceAtom` + переопределение `createAsyncAtom`),
`src/engine/resource.ts` (реализация `createResourceAtom`). Имя `createAsyncAtom` в поверхности
присутствует, но локально переопределено — сигнатура `() => never`, вызов всегда бросает.

<h2 id="использование">🚀 Использование</h2>

Шесть сценариев покрывают всё, чем реально пишется код с этим движком: глобальный стор с
событиями, точечный атом (писуемый или вычисляемый из другого), одно значение — синхронное или
асинхронное по ключу, — явная стейт-машина и подключение аддона поверх стора.

**Плоское хранилище:**

```ts
import { createStore, useSelector } from "@web-core/store";

export const counterStore = createStore({
  context: { count: 0 },
  on: {
    inc: (context, event: { by: number }) => ({ count: context.count + event.by }),
  },
});
```

```tsx
import { counterStore } from "./counter-store.js";

function Counter() {
  const count = useSelector(counterStore, (state) => state.context.count);
  return <button onClick={() => counterStore.trigger.inc({ by: 1 })}>{count()}</button>;
}
```

**Атомы:**

```ts
import { createAtom, useAtom } from "@web-core/store";

const idAtom = createAtom(1);                       // writable
const doubledAtom = createAtom(() => idAtom.get() * 2); // computed, read-only

function View() {
  const doubled = useAtom(doubledAtom);
  return <p>{doubled()}</p>;
}
```

**`createResourceAtom` — без ключа:**

```ts
import { createResourceAtom } from "@web-core/store";

export const componentsAtom = createResourceAtom(() => listComponents());
```

**`createResourceAtom` — с ключом:**

```ts
import { createResourceAtom, useAtom } from "@web-core/store";
import { createSignal } from "solid-js";

export const [selectedComponentId, setSelectedComponentId] = createSignal<string>();
export const componentInfoAtom = createResourceAtom(selectedComponentId, (id) => componentInfo(id));

function Panel() {
  const info = useAtom(componentInfoAtom);
  return (
    <p>
      {(() => {
        const state = info();
        return state.status === "done" ? state.data.name : state.status;
      })()}
    </p>
  );
}
```

**Стейт-машины:**

```ts
import { createMachine, useMachine } from "@web-core/store/machine";

const toggleMachine = createMachine({
  id: "toggle",
  initial: "inactive",
  states: {
    inactive: { on: { TOGGLE: "active" } },
    active: { on: { TOGGLE: "inactive" } },
  },
});

function Toggle() {
  const [state, send] = useMachine(toggleMachine);
  return <button onClick={() => send({ type: "TOGGLE" })}>{state.value as string}</button>;
}
```

**Аддоны:**

```ts
import { createStore } from "@web-core/store";
import { persist } from "@web-core/store/persist";

export const settingsStore = createStore({
  context: { theme: "light" },
  on: { setTheme: (ctx, e: { theme: string }) => ({ theme: e.theme }) },
}).with(persist({ name: "settings" }));
```

<h2 id="настройки">🎚️ Настройки</h2>

У движка нет одной сущности с общим списком настроек, как у компонента, — опции у каждого
конструктора свои: атомы сравнивают значения, `createStore` валидирует схемой, каждый аддон
настраивает свою сторону (стратегию хранения, глубину истории, что откатывать сбросом, что
проверять рантаймом). Таблица ниже — все именованные опции по функциям, к которым они относятся.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `compare` | `createAtom`/`createResourceAtom`/`createReducerAtom`, `options` | `(prev: T, next: T) => boolean` | `Object.is` |
| `schemas` | `createStore`, `definition.schemas` | `{context?, events?, emitted?}` (Standard Schema) | — |
| `strategy` | `persist`, `options.strategy` | `"snapshot" \| "event"` | `"snapshot"` |
| `name` | `persist`, `options.name` | `string` | обязательное |
| `storage` | `persist`, `options.storage` | `StateStorage` | `localStorage` |
| `version` | `persist`, `options.version` | `string \| number` | `0` |
| `throttle` | `persist`, `options.throttle` | `number` (мс) | `0` |
| `skipHydration` | `persist`, `options.skipHydration` | `boolean` | `false` |
| `filter`/`pick`/`migrate`/`merge` | `persist` (`strategy: "snapshot"`) | функции | — |
| `maxEvents` | `persist` (`strategy: "event"`) | `number` | `Infinity` |
| `strategy` | `undoRedo`, `options.strategy` | `"event" \| "snapshot"` | `"event"` |
| `historyLimit` | `undoRedo` (`strategy: "snapshot"`) | `number` | `Infinity` |
| `getTransactionId`/`skipEvent`/`compare`/`restore` | `undoRedo` | функции | — |
| `to` | `reset`, `options.to` | `(initial, current) => TContext` | полный сброс к initial |
| `context`/`events`/`emitted` | `validateSchemas`, `options` | `boolean` | — |
| `unknownEvents`/`unknownEmitted` | `validateSchemas`, `options` | `"throw" \| "ignore"` | — |

<h2 id="состояния">🎛️ Состояния</h2>

Каждая часть поверхности сообщает о себе меткой `status` (или `reason` у отказа валидации) —
атом о загрузке значения, стор о жизненном цикле перехода, машина о текущем узле. Ни одно из
этих состояний не придумано этим пакетом: все взяты как есть из типов `@xstate/store`/`xstate`,
кроме `ResourceState` — он свой, но по той же форме `{status,data,error}`, что и у апстрима.

| Состояние | Метка | Где |
|---|---|---|
| Атом ждёт ответа | `status: "pending"` | `ResourceState`, `createResourceAtom` |
| Атом получил значение | `status: "done"`, поле `data` | `ResourceState` |
| Атом получил ошибку | `status: "error"`, поле `error` | `ResourceState` |
| Стор активен | `status: "active"` | `StoreSnapshot`, `store.getSnapshot()` |
| Стор завершён | `status: "done"`, поле `output` | `StoreSnapshot` |
| Стор упал | `status: "error"`, поле `error` | `StoreSnapshot` |
| Стор остановлен | `status: "stopped"` | `StoreSnapshot` |
| Машина в состоянии | `state.value` (строка либо объект для вложенных/параллельных) | `useMachine`, `@web-core/store/machine` |
| Отказ валидации | `reason`: `"invalidContext" \| "invalidEvent" \| "invalidEmitted" \| "unknownEvent" \| "unknownEmitted" \| "asyncValidationUnsupported"` | `StoreValidationError`, `@web-core/store/validate` |

<h2 id="io">🔌 IO</h2>

Вход и выход у каждого конструктора — своя форма: одни принимают конфиг с описанием событий,
другие голое значение или геттер, третьи — фетчер, с ключом или без. Общее у всех через `.` —
событие в стор уходит через `send`/`trigger`, текущее значение читается через `get`/аксессор,
одним и тем же способом независимо от того, что конкретно создано.

<h3>📥 Вход</h3>

| Конструктор | Принимает |
|---|---|
| `createStore(definition)` | `{ context: TContext, on: { [event]: (context, event, enq) => TContext \| void }, schemas? }`. `enq` несёт `trigger`, `send`, `emit`, `effect(fn)` |
| `createAtom` | значение `T` (writable) либо геттер `(prev?: T) => T` (computed, read-only), второй параметр — `AtomOptions<T>` |
| `createResourceAtom` без ключа | `(fetcher: (info: { signal }) => Data \| Promise<Data>, options?)` |
| `createResourceAtom` с ключом | `(source: Accessor<Key>, fetcher: (key, info: { signal }) => Data \| Promise<Data>, options?)` |
| `store.send` | `{ type, ...payload }` |
| `store.trigger.<type>` | `payload` |
| `store.can.<type>` | `payload` |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `store.getSnapshot()` / `store.get()` | `StoreSnapshot<TContext> = { status, context, output, error }` |
| `atom.get()` | `T` напрямую |
| `useAtom` / `useSelector` | аксессор `() => T` |
| `createResourceAtom` | `ResourceState<Data, Err> = { status: "pending" } \| { status: "done", data } \| { status: "error", error }` |
| `store.can.<type>` | `boolean` |

<h2 id="сборки">🏗️ Сборки</h2>

Показаны только композиции, реально прогнанные рендером в тестах, — не теоретические примеры
использования. Каждая строка ниже — это конкретный тест, который её доказывает; композиция
аддонов друг с другом (`.with().with()`) тестом сегодня не покрыта — это документация в разделе
«Рецепт», а не доказанная сборка.

| Сборка | Что доказывает | Файл |
|---|---|---|
| `createStore` + `useSelector` | реальный рендер, `count()` меняется по `store.trigger.inc()` | `test/store.test.tsx` |
| `createMachine` + `useMachine` | реальный рендер, переход `TOGGLE` меняет `state.value` | `test/store.test.tsx` |
| `createResourceAtom` без ключа | `status: "done"` сразу, без промежуточного `pending` | `test/resource.test.tsx` |
| `createResourceAtom` с ключом | реагирует на смену ключа ПОСЛЕ резолва предыдущего запроса | `test/resource.test.tsx` |
| `createResourceAtom` с ключом, гонка | устаревший ответ игнорируется, если ключ сменился до его резолва | `test/resource.test.tsx` |
| `createResourceAtom` + `useAtom` | реальный рендер компонента, `pending` → `done` по смене ключа | `test/resource.test.tsx` |

<h2 id="рецепт">🎨 Рецепт</h2>

Съёмный слой этого движка — аддоны `@xstate/store`: не встроены в `createStore` заранее, а
подключаются явным `.with(...)` и комбинируются цепочкой — без вызова стор их не несёт вовсе.

```ts
import { createStore } from "@web-core/store";
import { persist } from "@web-core/store/persist";
import { undoRedo } from "@web-core/store/undo";
import { reset } from "@web-core/store/reset";

const store = createStore({
  context: { count: 0 },
  on: { inc: (ctx) => ({ count: ctx.count + 1 }) },
})
  .with(persist({ name: "counter" }))
  .with(undoRedo())
  .with(reset());

store.trigger.inc();
store.trigger.undo();  // добавлено undoRedo
store.trigger.reset(); // добавлено reset
```

`persist` добавляет гидратацию из storage при создании стора (если не `skipHydration`). `undoRedo`
добавляет события `undo`/`redo`. `reset` добавляет событие `reset`. `validateSchemas` не добавляет
событий — оборачивает переходы рантайм-проверкой по `schemas` из `createStore`.
