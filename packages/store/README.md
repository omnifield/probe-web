# ⚙️ web-core Store

🏷️ state · 🧬 engine · 📦 `@web-core/store`

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

⚡ Стейт web-core поверх XState-семьи — используйте, если нужно глобальное реактивное хранилище
вне дерева компонентов (без Provider) или явную стейт-машину с guards/вложенными состояниями/
акторами. `@xstate/store` даёт плоский zustand-по-духу слой (`createStore`, атомы), `xstate` —
опциональный слой полных машин поверх него же, одной согласованной семьёй, а не склейкой двух
разных вендоров. 🔄 Значение, посчитанное синхронно или полученное асинхронно по ключу из службы,
читается одним и тем же приёмом (`createResourceAtom`) — выбирать между разными техниками под
sync/async не нужно.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-узлов — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор,
которым эта часть достаётся. Плоское хранилище живёт в корне, стейт-машины и каждый аддон —
отдельным подпутём: приложение импортирует ровно то, что реально использует, и ничего сверх.

| Часть             | Адрес                      | Экспортирует                                                                                                                                                                                                                                      |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Плоское хранилище | `@web-core/store`          | `createStore`, `createAtom`, `createAtomConfig`, `createReducerAtom`, `createResourceAtom`, `createBoundAtom`, `createActionStore`, `createActionStoreFamily`, `createStoreConfig`, `createStoreLogic`, `shallowEqual`, `useSelector`, `useStore`, `useAtom`, `useAtomState` |
| Стейт-машины      | `@web-core/store/machine`  | весь `xstate` (`createMachine`, `setup`, `assign`, `fromPromise`, `createActor`, guards, …), `useMachine`, `useActor`, `useActorRef`, `fromActorRef`                                                                                              |
| Persist-аддон     | `@web-core/store/persist`  | `persist`, `persistAtom`, `createJSONStorage`, `clearStorage`, `flushStorage`, `isHydrated`, `rehydrateStore`, `createBroadcastStorage`, `subscribeToBroadcastStorage`                                                                            |
| Undo/redo-аддон   | `@web-core/store/undo`     | `undoRedo`                                                                                                                                                                                                                                        |
| Reset-аддон       | `@web-core/store/reset`    | `reset`                                                                                                                                                                                                                                           |
| Validate-аддон    | `@web-core/store/validate` | `validateSchemas`, `StoreValidationError`                                                                                                                                                                                                         |
| Mutate-аддон      | `@web-core/store/mutate`   | `mutate`, `castDraft`, `castImmutable`, тип `Draft` — `immer` обычная зависимость пакета, приложение его не ставит и не импортирует само                                                                                                          |

📦 Внутри `@web-core/store`: `src/index.ts` (тонкий реэкспорт), `src/engine/index.ts` (реэкспорт
`@xstate/store-solid` + `createResourceAtom` + `createBoundAtom` + `createActionStore` +
`createActionStoreFamily` + переопределение `createAsyncAtom`), `src/engine/resource.ts` (реализация
`createResourceAtom`), `src/engine/bound.ts` (реализация `createBoundAtom`), `src/engine/action-store.ts`
(реализация `createActionStore` и `createActionStoreFamily`). Имя `createAsyncAtom` в поверхности присутствует, но локально переопределено
— сигнатура `() => never`, вызов всегда бросает.

<h2 id="использование">🚀 Использование</h2>

✅ Восемь сценариев покрывают всё, чем реально пишется код с этим движком: глобальный стор с
событиями, точечный атом (писуемый или вычисляемый из другого), атом, ведомый внешним
Solid-аксессором, доменный стор в стиле Zustand/Pinia (`createActionStore`), одно значение —
синхронное или асинхронное по ключу, — явная стейт-машина и подключение аддона поверх стора.

**Плоское хранилище:**

```ts
import { createStore, useSelector } from "@web-core/store";

export const counterStore = createStore({
  context: { count: 0 },
  on: {
    inc: (context, event: { by: number }) => ({
      count: context.count + event.by,
    }),
  },
});
```

```tsx
import { counterStore } from "./counter-store.js";

function Counter() {
  const count = useSelector(counterStore, (state) => state.context.count);
  return (
    <button onClick={() => counterStore.trigger.inc({ by: 1 })}>
      {count()}
    </button>
  );
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

**`createBoundAtom`** — атом, ведомый внешним Solid-аксессором (пропом страницы, другим сигналом);
своей реактивности не заводит, обвязка `createEffect(() => atom.set(source()))`:

```ts
import { createBoundAtom, useAtom } from "@web-core/store";

export function ShowcasePage(props: { component: string }) {
  const currentComponentAtom = createBoundAtom(() => props.component);
  const current = useAtom(currentComponentAtom);
  return <p>{current()}</p>;
}
```

**`createActionStore`** — доменный стор в стиле Zustand/Pinia (state + actions + selectors): один
вызов вместо ручной сборки `createAtom` + объект-обёртка. `actionsFactory` получает `setState`/`get`,
возвращает объект actions — единственный публичный путь записи, `.set()` наружу не торчит (стор
типово — `ReadonlyAtom<T>` с довеском `actions`, читается тем же `useAtom`/`useSelector`, что и
любой атом):

```ts
// user.store.ts — обычный TS, ни одного импорта из solid-js
import { createActionStore } from "@web-core/store";

interface User {
  id: string;
  name: string;
  email: string;
}
interface UserState {
  user: User | null;
  loading: boolean;
}

export const userStore = createActionStore<
  UserState,
  {
    setUser(user: User): void;
    clearUser(): void;
    loadUser(): Promise<void>;
  }
>({ user: null, loading: false }, ({ setState }) => ({
  setUser(user) {
    setState((state) => ({ ...state, user }));
  },
  clearUser() {
    setState((state) => ({ ...state, user: null }));
  },
  async loadUser() {
    setState((state) => ({ ...state, loading: true }));
    try {
      const user = await fetch("/api/me").then((r) => r.json());
      setState((state) => ({ ...state, user, loading: false }));
    } catch (error) {
      setState((state) => ({ ...state, loading: false }));
      throw error;
    }
  },
}));
```

```tsx
import { userStore } from "./user.store";

function Profile() {
  const userName = userStore.use((state) => state.user?.name); // точечная подписка, не весь стор
  return (
    <button onClick={() => userStore.actions.loadUser()}>{userName()}</button>
  );
}
```

`store.use(selector)` — то же самое, что `useAtom(store, selector)`, но без отдельного импорта;
оба варианта эквивалентны и оба покрыты тестом (`store` типово — `ReadonlyAtom<T>`, годится в
`useAtom`/`useSelector` как обычный атом). Стор не сделан вызываемым напрямую (`store(selector)`,
как хук у Zustand) — `@xstate/store-solid` отличает атом от конфига по `typeof value === "object"`,
функция этой проверке не проходит и ломает `useAtom(store, selector)` извне; разбор — FAQ.md.

Асинхронные действия с несколькими промежуточными `setState` (loading → результат/ошибка) пишутся
обычным `async`-кодом — в отличие от `createStore`, чьи `on`-хендлеры по духу синхронные редьюсеры,
для такой последовательности неудобны. Разбор, почему под это не заведён отдельный движок
(`@tanstack/store`) — FAQ.md.

**`createActionStore` — полный пример: чтение и запись во всех сценариях, не только из компонента:**

```ts
// counter.store.ts — обычный TS, ни одного импорта из solid-js
import { createActionStore } from "@web-core/store";

interface CounterState {
  readonly count: number;
}

export const counterStore = createActionStore<
  CounterState,
  {
    increment(): void;
    decrement(): void;
    reset(): void;
    incrementByAsync(amount: number): Promise<void>;
  }
>({ count: 0 }, ({ setState }) => ({
  increment() {
    setState((state) => ({ ...state, count: state.count + 1 }));
  },
  decrement() {
    setState((state) => ({ ...state, count: state.count - 1 }));
  },
  reset() {
    setState({ count: 0 });
  },
  async incrementByAsync(amount) {
    await new Promise((resolve) => setTimeout(resolve, 300)); // например, запрос на сервер
    setState((state) => ({ ...state, count: state.count + amount }));
  },
}), () => ({
  // Вычисляемое от state (Pinia-getter) — третий аргумент, ЖИВЁТ внутри стора, не собирается
  // в компоненте: store.selectors.isEven() вместо store.use(state => state.count % 2 === 0)
  // где-то сбоку. Реактивный аксессор готов сразу после создания стора.
  isEven(state) {
    return state.count % 2 === 0;
  },
}));
```

```tsx
// CounterWidget.tsx — чтение и запись ИЗНУТРИ компонента
import { counterStore } from "./counter.store";

function CounterWidget() {
  const count = counterStore.use((state) => state.count); // точечное чтение, Solid-аксессор

  return (
    <div>
      <button onClick={counterStore.actions.decrement}>-</button>
      {count()}
      <button onClick={counterStore.actions.increment}>+</button>
      <button onClick={() => counterStore.actions.incrementByAsync(5)}>+5 async</button>
      <button onClick={counterStore.actions.reset}>reset</button>
      {counterStore.selectors.isEven() ? "чётное" : "нечётное"}
    </div>
  );
}
```

```ts
// где угодно ВНЕ компонента (роутер, интерсептор, обычная функция) — без Solid вообще
import { counterStore } from "./counter.store";

function onRouteChange() {
  console.log("count прямо сейчас:", counterStore.get().count); // разовое чтение снапшота, без подписки
  counterStore.actions.reset(); // запись работает так же, компонент не нужен
}
```

Правило на все случаи: читаешь внутри компонента разово/по месту → `.use(selector)`. Читаешь
именованное вычисляемое значение, которое нужно больше чем в одном месте, — заводи `selectors`
третьим аргументом при создании стора, зови `store.selectors.x()`. Читаешь разово снаружи
(роутер, обычная функция, тест) → `.get()`. Меняешь — всегда `.actions.*`, откуда угодно, `.set()`
нигде не трогаешь.

**`createActionStoreFamily`** — тот же `createActionStore`, но отдельный физический стор на каждый
ключ, не один общий слот с переключаемым содержимым. Нужен, когда несколько сущностей живы
ОДНОВРЕМЕННО и не должны видеть данные друг друга (конечный/известный набор ключей — каталог
компонентов, вкладки). Если в моменте жив ровно один инстанс, а ключей может быть много —
это `createResourceAtom`, не это; критерий — не размер N, а одновременная живость:

```ts
// feed.store.ts
import { createActionStoreFamily } from "@web-core/store";

interface FeedState {
  readonly feedData?: unknown;
}

export const feedStoreOf = createActionStoreFamily<FeedState, { setFeedData(value: unknown): void }>(
  {},
  ({ setState }) => ({
    setFeedData(value) {
      setState((state) => ({ ...state, feedData: value }));
    },
  }),
);
```

```tsx
// FeedPreset.tsx — переключение компонента читает/пишет СВОЙ стор, не общий слот
import { feedStoreOf } from "./feed.store";

function FeedPreset(props: { component: string }) {
  const feedData = feedStoreOf(props.component).use((state) => state.feedData);
  return <p>{JSON.stringify(feedData())}</p>;
}
```

Ленивое создание + кэш (`Map<K, ActionStore<...>>`) под капотом: `actionsFactory`/`selectorsFactory`
вызываются один раз на первое обращение к ключу, дальше — тот же инстанс. Без политики вытеснения
— рассчитан на конечный/известный набор ключей, не на неограниченный поток (для него кэш растёт
без границ). `K` сравнивается как ключ `Map` (`SameValueZero`): примитив — по значению, объект —
по ссылке; для составного ключа нужен свой `toKey(k): string` снаружи. Почему это не тот же случай,
что `createResourceAtom` с ключом, и не заплатка поверх обычного `createActionStore` — разбор,
FAQ.md.

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

**`persistAtom` — то же самое, но для атома** (у `createAtom` нет `.with()`, поэтому это отдельная
функция, не аддон стора):

```ts
import { createAtom } from "@web-core/store";
import { persistAtom } from "@web-core/store/persist";

export const countAtom = persistAtom(createAtom(0), { name: "count" }); // localStorage по умолчанию
```

```ts
import { createJSONStorage, persistAtom } from "@web-core/store/persist";

export const draftAtom = persistAtom(createAtom(""), {
  name: "draft",
  storage: createJSONStorage(() => sessionStorage), // локал → сешн — только эта опция и меняется
});
```

**`mutate` — Immer-рецепт вместо ручного `{...state, x}`**, годится и в `atom.set`, и в
`setState` из `createActionStore` (сигнатура та же — `(prev) => next`). `immer` — обычная
зависимость пакета (как `@xstate/store`), приложение его не ставит и не импортирует напрямую,
весь набор отдаётся через `./mutate`:

```ts
import { mutate } from "@web-core/store/mutate";

setOutfit(name) {
  setState(mutate<ComponentState>((draft) => {
    draft.outfit = name;
  }));
},
```

Явный `<ComponentState>` — не опция, а необходимость: без generic-аргумента `draft` выводится
как `unknown` (нечем зацепить `T` изнутри вложенного вызова), и `draft.x = y` не типизируется.
Проверено прогоном `tsc --strict`, не на словах.

**Замена целого поля, где внутри есть `readonly`-массив** (объект пришёл готовым — из фетча,
из другого конструктора — не мутируется по полям) — используй `castDraft` (тоже из
`@web-core/store/mutate`), не `as never`:

```ts
import { castDraft, mutate } from "@web-core/store/mutate";

setKit(kit: Kit) { // Kit.tags: readonly string[]
  setState(mutate<ComponentState>((draft) => {
    draft.kit = castDraft(kit); // без castDraft — ошибка типов, не баг Immer, а его защита
  }));
},
```

Временное место — планируется перенос в другой пакет, не перестраивать импорты заранее без
причины; разбор — FAQ.md.

<h2 id="настройки">🎚️ Настройки</h2>

🔧 У движка нет одной сущности с общим списком настроек, как у компонента, — опции у каждого
конструктора свои: атомы сравнивают значения, `createStore` валидирует схемой, каждый аддон
настраивает свою сторону (стратегию хранения, глубину истории, что откатывать сбросом, что
проверять рантаймом). Таблица ниже — все именованные опции по функциям, к которым они относятся.

| Настройка                                          | Где                                                              | Тип                                               | По умолчанию              |
| -------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- | ------------------------- |
| `compare`                                          | `createAtom`/`createResourceAtom`/`createReducerAtom`, `options` | `(prev: T, next: T) => boolean`                   | `Object.is`               |
| `schemas`                                          | `createStore`, `definition.schemas`                              | `{context?, events?, emitted?}` (Standard Schema) | —                         |
| `strategy`                                         | `persist`, `options.strategy`                                    | `"snapshot" \| "event"`                           | `"snapshot"`              |
| `name`                                             | `persist`, `options.name`                                        | `string`                                          | обязательное              |
| `storage`                                          | `persist`, `options.storage`                                     | `StateStorage`                                    | `localStorage`            |
| `version`                                          | `persist`, `options.version`                                     | `string \| number`                                | `0`                       |
| `throttle`                                         | `persist`, `options.throttle`                                    | `number` (мс)                                     | `0`                       |
| `skipHydration`                                    | `persist`, `options.skipHydration`                               | `boolean`                                         | `false`                   |
| `filter`/`pick`/`migrate`/`merge`                  | `persist` (`strategy: "snapshot"`)                               | функции                                           | —                         |
| `maxEvents`                                        | `persist` (`strategy: "event"`)                                  | `number`                                          | `Infinity`                |
| `name`                                             | `persistAtom`, `options.name`                                    | `string`                                          | обязательное              |
| `storage`                                          | `persistAtom`, `options.storage`                                 | `StateStorage` (синхронный)                       | `localStorage`            |
| `serialize`/`deserialize`                          | `persistAtom`, `options`                                         | функции                                           | `JSON.stringify`/`.parse` |
| `strategy`                                         | `undoRedo`, `options.strategy`                                   | `"event" \| "snapshot"`                           | `"event"`                 |
| `historyLimit`                                     | `undoRedo` (`strategy: "snapshot"`)                              | `number`                                          | `Infinity`                |
| `getTransactionId`/`skipEvent`/`compare`/`restore` | `undoRedo`                                                       | функции                                           | —                         |
| `to`                                               | `reset`, `options.to`                                            | `(initial, current) => TContext`                  | полный сброс к initial    |
| `context`/`events`/`emitted`                       | `validateSchemas`, `options`                                     | `boolean`                                         | —                         |
| `unknownEvents`/`unknownEmitted`                   | `validateSchemas`, `options`                                     | `"throw" \| "ignore"`                             | —                         |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Каждая часть поверхности сообщает о себе меткой `status` (или `reason` у отказа валидации) —
атом о загрузке значения, стор о жизненном цикле перехода, машина о текущем узле. Ни одно из
этих состояний не придумано этим пакетом: все взяты как есть из типов `@xstate/store`/`xstate`,
кроме `ResourceState` — он свой, но по той же форме `{status,data,error}`, что и у апстрима.

| Состояние             | Метка                                                                                                                                    | Где                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Атом ждёт ответа      | `status: "pending"`                                                                                                                      | `ResourceState`, `createResourceAtom`              |
| Атом получил значение | `status: "done"`, поле `data`                                                                                                            | `ResourceState`                                    |
| Атом получил ошибку   | `status: "error"`, поле `error`                                                                                                          | `ResourceState`                                    |
| Стор активен          | `status: "active"`                                                                                                                       | `StoreSnapshot`, `store.getSnapshot()`             |
| Стор завершён         | `status: "done"`, поле `output`                                                                                                          | `StoreSnapshot`                                    |
| Стор упал             | `status: "error"`, поле `error`                                                                                                          | `StoreSnapshot`                                    |
| Стор остановлен       | `status: "stopped"`                                                                                                                      | `StoreSnapshot`                                    |
| Машина в состоянии    | `state.value` (строка либо объект для вложенных/параллельных)                                                                            | `useMachine`, `@web-core/store/machine`            |
| Отказ валидации       | `reason`: `"invalidContext" \| "invalidEvent" \| "invalidEmitted" \| "unknownEvent" \| "unknownEmitted" \| "asyncValidationUnsupported"` | `StoreValidationError`, `@web-core/store/validate` |

<h2 id="io">🔌 IO</h2>

↔️ Вход и выход у каждого конструктора — своя форма: одни принимают конфиг с описанием событий,
другие голое значение или геттер, третьи — фетчер, с ключом или без. Общее у всех через `.` —
событие в стор уходит через `send`/`trigger`, текущее значение читается через `get`/аксессор,
одним и тем же способом независимо от того, что конкретно создано.

### 📥 Вход

| Конструктор                    | Принимает                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createStore(definition)`      | `{ context: TContext, on: { [event]: (context, event, enq) => TContext \| void }, schemas? }`. `enq` несёт `trigger`, `send`, `emit`, `effect(fn)` |
| `createAtom`                   | значение `T` (writable) либо геттер `(prev?: T) => T` (computed, read-only), второй параметр — `AtomOptions<T>`                                    |
| `createResourceAtom` без ключа | `(fetcher: (info: { signal }) => Data \| Promise<Data>, options?)`                                                                                 |
| `createResourceAtom` с ключом  | `(source: Accessor<Key>, fetcher: (key, info: { signal }) => Data \| Promise<Data>, options?)`                                                     |
| `createBoundAtom`              | `(source: Accessor<T>, options?: AtomOptions<T>)`                                                                                                  |
| `createActionStore`            | `(initialValue: T, actionsFactory: (helpers: {setState, get}) => TActions, options?: AtomOptions<T>)`, либо с третьим `selectorsFactory: () => TSelectors` перед `options`               |
| `createActionStoreFamily`      | те же аргументы, что у `createActionStore` — отдаёт не стор, а `(key: K) => ActionStore<T, TActions, TSelectors>`                                                                        |
| `store.send`                   | `{ type, ...payload }`                                                                                                                             |
| `store.trigger.<type>`         | `payload`                                                                                                                                          |
| `store.can.<type>`             | `payload`                                                                                                                                          |

### 📤 Выход

| Источник                              | Отдаёт                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `store.getSnapshot()` / `store.get()` | `StoreSnapshot<TContext> = { status, context, output, error }`                                               |
| `atom.get()`                          | `T` напрямую                                                                                                 |
| `useAtom` / `useSelector`             | аксессор `() => T`                                                                                           |
| `createResourceAtom`                  | `ResourceState<Data, Err> = { status: "pending" } \| { status: "done", data } \| { status: "error", error }` |
| `createActionStore`                   | `ActionStore<T, TActions, TSelectors?> = ReadonlyAtom<T> & { actions, selectors, use(selector?) }` — `.set()` не публичный |
| `createActionStoreFamily`             | `(key: K) => ActionStore<T, TActions, TSelectors?>` — ленивая, с кэшем по ключу |
| `store.can.<type>`                    | `boolean`                                                                                                    |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Показаны только композиции, реально прогнанные рендером в тестах, — не теоретические примеры
использования. Каждая строка ниже — это конкретный тест, который её доказывает; композиция
аддонов друг с другом (`.with().with()`) тестом сегодня не покрыта — это документация в разделе
«Рецепт», а не доказанная сборка.

| Сборка                                                    | Что доказывает                                                    | Файл                         |
| --------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `createStore` + `useSelector`                             | реальный рендер, `count()` меняется по `store.trigger.inc()`      | `test/store.test.tsx`        |
| `createMachine` + `useMachine`                            | реальный рендер, переход `TOGGLE` меняет `state.value`            | `test/store.test.tsx`        |
| `createResourceAtom` без ключа                            | `status: "done"` сразу, без промежуточного `pending`              | `test/resource.test.tsx`     |
| `createResourceAtom` с ключом                             | реагирует на смену ключа ПОСЛЕ резолва предыдущего запроса        | `test/resource.test.tsx`     |
| `createResourceAtom` с ключом, гонка                      | устаревший ответ игнорируется, если ключ сменился до его резолва  | `test/resource.test.tsx`     |
| `createResourceAtom` + `useAtom`                          | реальный рендер компонента, `pending` → `done` по смене ключа     | `test/resource.test.tsx`     |
| `createBoundAtom`                                         | начальное значение сразу, атом следует за сменой аксессора        | `test/bound.test.tsx`        |
| `createBoundAtom` + `useAtom`                             | реальный рендер компонента, значение меняется вслед за сигналом   | `test/bound.test.tsx`        |
| `createActionStore`                                       | `actions` меняют state, `.set()` наружу не торчит                 | `test/action-store.test.tsx` |
| `createActionStore`, async action                         | `loading: true` во время await, ошибка пробрасывается вызывающему | `test/action-store.test.tsx` |
| `createActionStore` + `useAtom`                           | реальный рендер компонента, значение меняется по вызову `actions` | `test/action-store.test.tsx` |
| `createActionStore` + `.use(selector)`                    | тот же рендер через `store.use(...)` вместо `useAtom(store, ...)` | `test/action-store.test.tsx` |
| `createActionStore` + `.use()` без селектора               | отдаёт весь state                                                 | `test/action-store.test.tsx` |
| `createActionStore` + `selectorsFactory`                    | `store.selectors.x()` готов сразу после создания, без `.use()`     | `test/action-store.test.tsx` |
| `createActionStore`, несколько селекторов                   | каждый следит за своей частью state независимо                    | `test/action-store.test.tsx` |
| `createActionStore` + `selectors` в реальном рендере         | реальный рендер компонента, значение меняется по вызову `actions`  | `test/action-store.test.tsx` |
| `createActionStoreFamily`, разные ключи                     | физически разные store, запись в один не видна в другом            | `test/action-store.test.tsx` |
| `createActionStoreFamily`, повтор ключа                     | кэш — тот же инстанс, не пересоздание                              | `test/action-store.test.tsx` |
| `createActionStoreFamily` в реальном рендере                | переключение ключа между рендерами не путает данные разных сущностей | `test/action-store.test.tsx` |
| `createActionStoreFamily` + `selectorsFactory`               | третий аргумент работает так же, как у `createActionStore`         | `test/action-store.test.tsx` |
| `persistAtom` + localStorage                              | гидратация при вызове, запись при `.set()`                        | `test/persist.test.tsx`      |
| `persistAtom` + `createJSONStorage(() => sessionStorage)` | тот же `persistAtom`, локал и сешн не пересекаются                | `test/persist.test.tsx`      |
| `mutate`                                                   | recipe мутирует draft, наружу — новое значение, старое не тронуто | `test/mutate.test.tsx`       |
| `mutate` + `createAtom.set`                                | работает как updater атома                                        | `test/mutate.test.tsx`       |
| `mutate` + `createActionStore`'s `setState`                | работает как updater в action                                     | `test/mutate.test.tsx`       |
| `mutate` + `castDraft`                                      | замена поля с `readonly`-массивом внутри без `as never`            | `test/mutate.test.tsx`       |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Съёмный слой этого движка — аддоны `@xstate/store`: не встроены в `createStore` заранее, а
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
store.trigger.undo(); // добавлено undoRedo
store.trigger.reset(); // добавлено reset
```

✨ `persist` добавляет гидратацию из storage при создании стора (если не `skipHydration`). `undoRedo`
добавляет события `undo`/`redo`. `reset` добавляет событие `reset`. `validateSchemas` не добавляет
событий — оборачивает переходы рантайм-проверкой по `schemas` из `createStore`.
