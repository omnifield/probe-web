# 🧪 Примеры — как работать с `@web-core/store`

Рабочий код для локального теста, не канон. Архитектура и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

Цель файла: покрыть примером КАЖДЫЙ экспортируемый конструктор пакета — если механики нет здесь,
считай, что её нет вообще (нечем проверить, что она работает так, как кажется). Разделы идут по
той же карте, что в README ("Анатомия") — сначала `.`, потом `./machine`, потом аддоны.

## `.` — плоское хранилище (`createStore`, атомы, доменные сторы, `createResourceAtom`)

### 1. `createActionStore` — хук читается напрямую, без обёртки

Самый частый случай: стор фиксирован (модульный синглтон, не привязан к ключу), компонент читает
его один раз при сетапе. `.use(selector)` уже отдаёт реактивный аксессор — оборачивать его ещё в
`createMemo` не нужно, это и есть штатный вызов "хук как хук":

```tsx
import { createActionStore } from "@web-core/store";

interface CounterState {
  readonly count: number;
}

const counterStore = createActionStore<CounterState, { increment(): void }>(
  { count: 0 },
  ({ setState }) => ({
    increment() {
      setState((state) => ({ ...state, count: state.count + 1 }));
    },
  }),
);

export function CounterDemo() {
  const count = counterStore.use((state) => state.count); // хук вызван напрямую, без createMemo

  return (
    <button onClick={counterStore.actions.increment}>{count()}</button>
  );
}
```

Полезно проверить: клик меняет цифру, в коде нет ни одного `createSignal`/`createMemo` — всю
реактивность несёт сам `.use()`.

### 2. `createActionStore` — третий аргумент `selectorsFactory` (Pinia-getters)

Вычисляемое от state, которое нужно больше чем в одном месте, — заводи ТРЕТЬИМ аргументом при
создании стора, а не отдельной функцией-селектором, собираемой в компоненте (`store.use(fn)` со
своим `fn` сбоку от стора технически работает, но ломает инкапсуляцию так же, как торчащий наружу
`.set()` — разбор в FAQ.md). Каждая функция оборачивается в `useAtom` ОДИН раз при создании стора и
становится готовым реактивным аксессором:

```tsx
import { createActionStore } from "@web-core/store";

interface CounterState {
  readonly count: number;
}

// generic-аргументов ровно 3 (T, TActions, TSelectors) — ровно 2, как в примере №1, здесь не
// типизируется: перегрузка с selectorsFactory резолвится по количеству явных type-параметров,
// не по числу переданных аргументов вызова.
const counterStore = createActionStore<
  CounterState,
  { increment(): void },
  { isEven(state: CounterState): boolean }
>(
  { count: 0 },
  ({ setState }) => ({
    increment() {
      setState((state) => ({ ...state, count: state.count + 1 }));
    },
  }),
  () => ({
    isEven(state) {
      return state.count % 2 === 0; // 3-й аргумент вызова — selectorsFactory, не options
    },
  }),
);

export function ParitySelectorDemo() {
  return (
    <button onClick={counterStore.actions.increment}>
      {counterStore.selectors.isEven() ? "чётное" : "нечётное"} {/* без .use() */}
    </button>
  );
}
```

Если селекторы не нужны, третьим аргументом идёт `options: AtomOptions<T>` (например `compare`) —
перегрузка различает их рантаймом по `typeof === "function"`. Если нужны и `selectorsFactory`, и
`options` вместе — `options` уходит на 4-е место: `createActionStore(initial, actionsFactory,
selectorsFactory, options)`.

Полезно проверить: подпись кнопки переключается "нечётное" → "чётное" на каждый клик, без единого
`.use()`/`createMemo` в компоненте под это конкретное значение.

### 3. `createActionStore` — чтение и запись СНАРУЖИ компонента

Стор не привязан к дереву компонентов — читать/писать можно откуда угодно (роутер, интерсептор,
тест), без единого импорта из `solid-js`:

```ts
import { createActionStore } from "@web-core/store";

const authStore = createActionStore<{ token?: string }, { setToken(token: string): void; clear(): void }>(
  {},
  ({ setState }) => ({
    setToken(token) {
      setState((state) => ({ ...state, token }));
    },
    clear() {
      setState({});
    },
  }),
);

export function onLoginSuccess(token: string) {
  authStore.actions.setToken(token); // запись без компонента
}

export function isAuthed(): boolean {
  return authStore.get().token !== undefined; // разовое чтение снапшота, без подписки
}
```

Полезно проверить: вызови `onLoginSuccess("abc")`, затем `isAuthed()` — `true`, ни разу не
понадобился Solid.

### 4. `createActionStoreFamily` — ключ фиксирован на весь жизненный цикл компонента

Тот же приём для семьи сторов: пока ключ (`props.id`) не меняется, пока компонент жив — `.use()`
тоже вызывается один раз, напрямую, без обёртки:

```tsx
import { createActionStoreFamily } from "@web-core/store";

interface TabState {
  readonly label: string;
}

const tabStoreOf = createActionStoreFamily<TabState, { rename(label: string): void }>(
  { label: "новая вкладка" },
  ({ setState }) => ({
    rename(label) {
      setState((state) => ({ ...state, label }));
    },
  }),
);

function Tab(props: { id: string }) {
  const label = tabStoreOf(props.id).use((state) => state.label); // напрямую, ключ = props.id не меняется

  return (
    <input value={label()} onInput={(e) => tabStoreOf(props.id).actions.rename(e.currentTarget.value)} />
  );
}
```

Полезно проверить: два `<Tab id="a" />`/`<Tab id="b" />` рядом — правка одного поля не трогает
второе, это разные физические сторы, не один слот.

### 5. Ключ семьи реактивный, компонент сам НЕ перемонтируется — перемонтируй поддерево по ключу

Ключ приходит из роута (`useParams`) и может смениться, пока внешний компонент остаётся
смонтированным (родитель его не размонтирует). Вызов `family(key).use(selector)` один раз в теле
ВНЕШНЕГО компонента тут не годится — он навсегда привязывается к стору, который был текущим в
момент первого рендера, и не заметит смену ключа.

Движок здесь ни при чём — это не повод заводить у семьи отдельный хук под "реактивный ключ" и
оборачивать `.use()` в `createMemo`. Правильное место — само дерево компонентов: перемонтировать
ПОДДЕРЕВО, которое читает стор, явным `<Show keyed>` по ключу. Внутри перемонтированного поддерева
ключ на весь его жизненный цикл фиксирован — `family(key).use(selector)` вызывается ровно так же
прямо, как в примере №4, никакой обёртки не нужно:

```tsx
import { Show } from "solid-js";
import { componentManagerStoreOf } from "../../model";

function FeedManual() {
  const component = useParams({ strict: false, select: (p) => p.component });

  return (
    <Show when={component()} keyed>
      {(name) => <FeedFor component={name} />}
    </Show>
  );
}

function FeedFor(props: { component: string }) {
  const store = componentManagerStoreOf(props.component); // ключ фиксирован на весь жизненный цикл FeedFor
  const value = store.use((state) => state.feedData); // напрямую, без createMemo — как в примере №4

  return <p>{JSON.stringify(value())}</p>;
}
```

Важно: `<Show keyed>` перемонтирует детей по значению `when` — ключи `<Show>` для этого нужно
ключить НАПРЯМУЮ строкой самого ключа семьи (`component()`), а не производным от неё значением
(схемой, конфигом и т.п.). Если два разных ключа семьи вдруг дадут одно и то же производное
значение (например, две сущности случайно делят один и тот же объект-конфиг), `<Show>` решит, что
ничего не изменилось, не перемонтирует — и `FeedFor` останется висеть на старом ключе. Ключ семьи и
ключ `<Show keyed>` должны быть одним и тем же значением, не просто чем-то, что обычно меняется
вместе с ним.

Полезно проверить: смени параметр роута — `FeedFor` пересоздаётся целиком (значит, и стор внутри
него), значение переключается на данные нового ключа; запись в стор другого (неактивного) ключа на
экран не просачивается, пока на него явно не переключились.

### 6. `createStore` + `useSelector` — плоское хранилище, события вместо actions

Когда состояние проще выразить событиями (`on: { тип: (context, event) => новыйContext }`), а не
объектом actions — например, конечная стейт-машина без вложенных состояний/guards, для которой
полноценная `./machine` избыточна:

```tsx
import { createStore, useSelector } from "@web-core/store";

const counterStore = createStore({
  context: { count: 0 },
  on: {
    inc: (context, event: { by: number }) => ({ count: context.count + event.by }),
  },
});

export function FlatStoreDemo() {
  const count = useSelector(counterStore, (state) => state.context.count);
  return (
    <button onClick={() => counterStore.trigger.inc({ by: 1 })}>{count()}</button>
  );
}
```

Полезно проверить: клик прибавляет `1`; `counterStore.send({ type: "inc", by: 1 })` — то же самое,
`trigger.inc(payload)` просто короче писать на вызывающей стороне.

### 7. `createAtom` — точечный атом, писуемый и вычисляемый

Самая мелкая единица движка — одно значение, без actions/событий вокруг:

```tsx
import { createAtom, useAtom } from "@web-core/store";

const idAtom = createAtom(1); // writable
const doubledAtom = createAtom(() => idAtom.get() * 2); // computed, read-only — геттер вместо значения

export function AtomDemo() {
  const id = useAtom(idAtom);
  const doubled = useAtom(doubledAtom);

  return (
    <button onClick={() => idAtom.set((prev) => prev + 1)}>
      {id()} × 2 = {doubled()}
    </button>
  );
}
```

Полезно проверить: клик — `id` растёт на 1, `doubled` растёт на 2 сам, без ручной синхронизации.

### 8. `createReducerAtom` — атом, меняющийся событиями (как `useReducer`), не голым `.set()`

```tsx
import { createReducerAtom, useAtom } from "@web-core/store";

type CounterEvent = { type: "inc"; by: number } | { type: "reset" };

const counterAtom = createReducerAtom(0, (state: number, event: CounterEvent) =>
  event.type === "inc" ? state + event.by : 0,
);

export function ReducerAtomDemo() {
  const count = useAtom(counterAtom);
  return (
    <div>
      <button onClick={() => counterAtom.send({ type: "inc", by: 3 })}>+3</button>
      <button onClick={() => counterAtom.send({ type: "reset" })}>сброс</button>
      <p>{count()}</p>
    </div>
  );
}
```

Полезно проверить: "+3" трижды подряд даёт `9`, "сброс" возвращает `0` — `.set()` тут вообще не
нужен, вся запись идёт через `send`.

### 9. `createBoundAtom` — атом, ведомый внешним Solid-аксессором

Синк атома с внешним реактивным источником (пропом компонента, сигналом из другого места) — не
своя реактивность, обвязка поверх `createEffect(() => atom.set(source()))` (тот же приём, что у
Jotai `useAtomEffect`, разбор — FAQ.md):

```tsx
import { createBoundAtom, useAtom } from "@web-core/store";

export function ShowcasePage(props: { component: string }) {
  const currentComponentAtom = createBoundAtom(() => props.component);
  const current = useAtom(currentComponentAtom);
  return <p>{current()}</p>;
}
```

Атом остаётся писуемым напрямую через `.set()` — источник его не блокирует, просто продолжает
перезаписывать своим значением на каждое изменение `props.component`.

Полезно проверить: смени `props.component` снаружи — `current()` следует за ним; вызови
`currentComponentAtom.set("вручную")` — значение меняется, до следующего изменения `props.component`.

### 10. `createResourceAtom` без ключа — один фетч при создании

```tsx
import { createResourceAtom, useAtom } from "@web-core/store";

function fakeFetchComponents() {
  return new Promise<string[]>((resolve) => setTimeout(() => resolve(["button", "checkbox"]), 300));
}

const componentsAtom = createResourceAtom(() => fakeFetchComponents());

export function ResourceNoKeyDemo() {
  const state = useAtom(componentsAtom);
  // снапшот в переменную ОДИН раз — дискриминация по .status не сужает тип через два разных
  // вызова state(), только через одно и то же значение
  return (
    <p>
      {(() => {
        const snapshot = state();
        return snapshot.status === "done" ? snapshot.data.join(", ") : snapshot.status;
      })()}
    </p>
  );
}
```

Полезно проверить: текст сначала `pending`, через 300мс — `button, checkbox`; фетчер вызывается
РОВНО один раз, повторный рендер компонента новый запрос не запускает (атом модульный, живёт вне
компонента).

### 11. `createResourceAtom` с ключом — гонка резолвится сама

Смена ключа до того, как предыдущий фетч успел ответить, — устаревший ответ должен быть
проигнорирован:

```tsx
import { createResourceAtom, useAtom } from "@web-core/store";
import { createSignal } from "solid-js";

function fakeFetchUser(id: string) {
  const delay = id === "slow" ? 800 : 100;
  return new Promise<{ id: string }>((resolve) => setTimeout(() => resolve({ id }), delay));
}

const [userId, setUserId] = createSignal("slow");
const userAtom = createResourceAtom(userId, (id) => fakeFetchUser(id));

export function ResourceRaceDemo() {
  const user = useAtom(userAtom);

  return (
    <div>
      <button onClick={() => setUserId("slow")}>slow (800мс)</button>
      <button onClick={() => setUserId("fast")}>fast (100мс)</button>
      <p>{JSON.stringify(user())}</p>
    </div>
  );
}
```

Полезно проверить: жми "slow", сразу за ним "fast" — итоговое значение `id: "fast"`, ответ
"slow" приходит позже, но уже не актуален, `status` не мигает обратно в `pending` после `done`.

### 12. `createAtomConfig` + `useAtomState` — атом, локальный для компонента

Атомы выше — модульные синглтоны (создаются один раз, живут вне дерева компонентов). Когда атом
нужен НА ВРЕМЯ ЖИЗНИ конкретного компонента (не переживает его размонтирование, не расшарен
между инстансами) — `createAtomConfig` даёт конфиг вместо готового атома, `useAtomState` создаёт
по нему атом внутри текущего Solid-владельца и сразу возвращает `[value, atom]`:

```tsx
import { createAtomConfig, useAtomState } from "@web-core/store";

const localCounterConfig = createAtomConfig(0);

export function LocalAtomDemo() {
  const [count, atom] = useAtomState(localCounterConfig);
  return <button onClick={() => atom.set((prev) => prev + 1)}>{count()}</button>;
}
```

Полезно проверить: смонтируй `<LocalAtomDemo />` дважды рядом — счётчики независимы (каждый со
своим атомом), в отличие от модульного `createAtom` из примера №7, где все инстансы делили бы одно
значение.

## `./machine` — стейт-машины (полный `xstate`, когда нужны guards/вложенные состояния/акторы)

### 13. `createMachine` + `useMachine`

```tsx
import { createMachine, useMachine } from "@web-core/store/machine";

const toggleMachine = createMachine({
  id: "toggle",
  initial: "inactive",
  states: {
    inactive: { on: { TOGGLE: "active" } },
    active: { on: { TOGGLE: "inactive" } },
  },
});

export function ToggleDemo() {
  const [state, send] = useMachine(toggleMachine);
  return <button onClick={() => send({ type: "TOGGLE" })}>{state.value as string}</button>;
}
```

Читается точкой (`state.value`), не вызовом как функции — `useMachine`/`useActor` отдают
реактивный solid-стор (`createStore` из `solid-js/store`), не аксессор, в отличие от `useAtom`/
`useSelector` (разбор — FAQ.md).

Полезно проверить: клик переключает подпись `inactive` ↔ `active`.

## Аддоны — подключаются явным импортом отдельного подпути, ничего не подмешано в `.` по умолчанию

### 14. `./mutate` — Immer-рецепт вместо ручного `{...state, x}`

Годится и в `atom.set`, и в `setState` из `createActionStore` (сигнатура updater'а та же —
`(prev) => next`). `immer` — обычная зависимость пакета, ничего ставить в приложении не нужно:

```ts
import { castDraft, mutate } from "@web-core/store/mutate";
import { createActionStore } from "@web-core/store";

interface Kit {
  readonly tags: readonly string[];
}
interface ComponentState {
  readonly outfit?: string;
  readonly kit?: Kit;
}

const componentStore = createActionStore<ComponentState, { setOutfit(name: string): void; setKit(kit: Kit): void }>(
  {},
  ({ setState }) => ({
    setOutfit(name) {
      setState(
        mutate<ComponentState>((draft) => {
          draft.outfit = name; // мутация draft, наружу — новое значение, старое не трогает
        }),
      );
    },
    setKit(kit) {
      // kit пришёл готовым (не draft), внутри readonly-массив — castDraft вместо `as never`
      setState(
        mutate<ComponentState>((draft) => {
          draft.kit = castDraft(kit);
        }),
      );
    },
  }),
);
```

Явный `<ComponentState>` у `mutate<T>` — не опция, без него `draft` выводится как `unknown`
(разбор — FAQ.md).

Полезно проверить: `componentStore.actions.setOutfit("dark")` → `componentStore.get().outfit ===
"dark"`, исходный объект state не мутирован (`Object.is` со старым снапшотом — `false`).

### 15. `./persist` — `persistAtom`, атом переживает перезагрузку страницы

`createStore` подключает `persist` через `.with(...)` (аддон самого `@xstate/store`, см. пример
№17). У `createAtom` нет `.with()` — для него отдельная функция `persistAtom`:

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

Полезно проверить (юнит, без браузера): `localStorage.setItem("count", JSON.stringify(5))` ДО
`persistAtom(createAtom(0), { name: "count" })` — атом гидрируется значением `5`, не `0`;
`atom.set(3)` — `localStorage.getItem("count") === "3"` сразу же, без отдельного `flush`.

### 16. `./undo`, `./reset` — события `undo`/`redo`/`reset` поверх `createStore`

⚠️ Прямой реэкспорт аддонов `@xstate/store` — работают через `.with(...)`, композиция друг с
другом (как ниже) не покрыта тестом в этом пакете, это рецепт, не доказанная сборка (см. README,
раздел "Сборки"):

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

Полезно проверить: `store.trigger.inc()` дважды → `count: 2`; `store.trigger.undo()` → `count: 1`;
`store.trigger.reset()` → `count: 0` (назад к initial, не к состоянию до undo).

### 17. `./validate` — `validateSchemas`, рантайм-проверка переходов по Standard Schema

Оборачивает переходы `createStore` проверкой контекста/событий по схеме (zod/valibot/любая
Standard-Schema-совместимая библиотека — сам пакет `zod` в `@web-core/store` не тянется, схему
приносит вызывающий код):

```ts
import { createStore } from "@web-core/store";
import { validateSchemas } from "@web-core/store/validate";

// минимальная Standard Schema вручную, без внешней библиотеки — только для примера.
// schemas.context валидирует ВЕСЬ контекст целиком (не поле по имени) — сигнатура самого
// @xstate/store, не этого пакета. `types` нужен ТОЛЬКО для вывода типов TypeScript (не читается
// в рантайме) — без него TContext резолвится в `never`, схема без `types` не проходит тайпчек.
const nonNegativeContextSchema = {
  "~standard": {
    version: 1 as const,
    vendor: "example",
    types: undefined as unknown as { input: { count: number }; output: { count: number } },
    validate: (value: unknown) =>
      typeof value === "object" && value !== null && (value as { count: number }).count >= 0
        ? { value: value as { count: number } }
        : { issues: [{ message: "count must be >= 0" }] },
  },
};

const store = createStore({
  context: { count: 0 },
  on: { inc: (ctx) => ({ count: ctx.count + 1 }) },
  schemas: { context: nonNegativeContextSchema },
}).with(validateSchemas({ context: true }));
```

Полезно проверить: `store.trigger.inc()` — ок, `count: 1` проходит схему; если поменять редьюсер
так, чтобы `count` мог уйти в минус, `.with(validateSchemas({ context: true }))` бросит
`StoreValidationError` с `reason: "invalidContext"` на первом же нарушающем переходе.

## Ещё есть — тонкие реэкспорты `@xstate/store`, без своей обвязки

Полная документация — у самого `@xstate/store`, здесь только что это и зачем:

- `createStoreConfig`/`createStoreLogic` — конфиг стора без немедленного создания (для
  `createStoreLogic`-сценариев `xstate`, когда стор нужен как переиспользуемая "логика", а не
  готовый инстанс).
- `shallowEqual(a, b)` — готовый неглубокий компаратор, годится как `compare` в `AtomOptions`
  вместо самодельного `(a, b) => a.x === b.x && a.y === b.y`.
- `clearStorage`/`flushStorage`/`isHydrated`/`rehydrateStore`/`createBroadcastStorage`/
  `subscribeToBroadcastStorage` (`./persist`) — служебные хелперы вокруг `persist`/`persistAtom`
  (ручной сброс storage, ожидание гидратации, синк между вкладками).
- `StoreValidationError` (`./validate`) — класс ошибки, которую бросает `validateSchemas`, с
  `reason: "invalidContext" | "invalidEvent" | "invalidEmitted" | "unknownEvent" |
  "unknownEmitted" | "asyncValidationUnsupported"`.

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { CounterDemo } from "..."; // любой пример выше

export function LabPage() {
  return <CounterDemo />;
}
```
