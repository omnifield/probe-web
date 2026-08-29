# @omnifield/probe-web-store

Стейт probe-web поверх семьи **XState** — `@xstate/store` (плоское событийное хранилище,
zustand-по-духу) и, отдельным опциональным слоем, `xstate` целиком (явные стейт-машины).
Приложение импортирует ровно этот пакет — никогда `@xstate/store`/`@xstate/store-solid`/
`xstate`/`@xstate/solid` напрямую, — той же причиной, что и `@omnifield/probe-web-router`:
единый путь резолва даёт единый экземпляр модуля.

## Почему XState-семья, а не буквальный Zustand

У Zustand нет официальных Solid-биндингов вообще — его хуки завязаны на React
(`use-sync-external-store`), а Solid своей тонкозернистой реактивностью решает ровно ту задачу,
под которую в React звали Zustand: локальный компонентный стейт Zustand не нужен, `createSignal`
справляется сам. Взять «vanilla»-часть Zustand и написать Solid-обвязку самим — тот же объём
работы, что уже сделан и поддерживается апстримом в `@xstate/store` + `@xstate/store-solid`:
событийное хранилище один-в-один по духу («store с `context`, события меняют его»), плюс
официальный `useSelector`, плюс бесплатно достаётся вторая половина — совместимый слой полных
стейт-машин от той же команды (Stately), если плоского стора перестанет хватать. Это и есть
комбинация «XState + Zustand», о которой шла речь — но одной согласованной семьёй вместо склейки
два вендора, один из которых Solid не поддерживает вовсе.

## Два подпути — два слоя, не альтернативы друг другу

- **`.`** — плоское хранилище, «Zustand-слой»: `createStore`, атомы (`createAtom`,
  `createAsyncAtom`, `createReducerAtom`), хуки `useSelector`/`useStore`/`useAtom`/`useAtomState`.
  Обязательный peer — только `solid-js`.
- **`./machine`** — стейт-машины целиком: весь `xstate` (`createMachine`, `setup`, `assign`,
  `fromPromise`, guards, акторы, …) плюс хуки `useMachine`/`useActor`/`useActorRef`/`fromActorRef`
  из `@xstate/solid`. **Опциональный** peer (`xstate`, `@xstate/solid`) — приложение, которому
  хватает плоского стора, эти два пакета не ставит вовсе.
- **`./persist`, `./undo`, `./reset`, `./validate`** — аддоны `@xstate/store` (`.with(...)`),
  подпутями по той же причине, что у `router`: `@xstate/store` — НАША зависимость, без реэкспорта
  её подпути недостижимы строгим pnpm.

## Слой `.`: плоское хранилище

```ts
// src/counter-store.ts
import { createStore } from "@omnifield/probe-web-store";

export const counterStore = createStore({
  context: { count: 0 },
  on: {
    inc: (context, event: { by: number }) => ({ count: context.count + event.by }),
  },
});
```

```tsx
// где угодно в дереве компонентов — без Provider, стор живёт вне дерева
import { useSelector } from "@omnifield/probe-web-store";

import { counterStore } from "./counter-store.js";

function Counter() {
  // useSelector отдаёт АКСЕССОР — вызывать как функцию, как useParams/useSearch у router.
  const count = useSelector(counterStore, (state) => state.context.count);
  return (
    <button onClick={() => counterStore.trigger.inc({ by: 1 })}>
      {count()}
    </button>
  );
}
```

`store.trigger.inc({ by: 1 })` — сахар над `store.send({ type: "inc", by: 1 })`, оба варианта
равноценны. `store.can.inc()` проверяет допустимость события без отправки, `store.getSnapshot()`
читает разово.

## Слой `./machine`: явные стейт-машины

```tsx
import { createMachine } from "@omnifield/probe-web-store/machine";
import { useMachine } from "@omnifield/probe-web-store/machine";

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
  // ВАЖНО: `state` здесь НЕ аксессор — реактивный solid-стор (createStore из solid-js/store),
  // читается путём свойства: `state.value`, `state.context.x`. В отличие от useSelector выше и
  // от useParams/useSearch в router, звать его как функцию НЕ НАДО — это устройство самого
  // @xstate/solid (deep-clone снапшота в solid-стор при каждом обновлении), не наша обёртка.
  return <button onClick={() => send({ type: "TOGGLE" })}>{state.value as string}</button>;
}
```

Когда нужен just актор без встроенного рендер-цикла компонента (например, стор живёт вне
дерева) — `useActorRef`/`fromActorRef`, тот же принцип: `fromActorRef` отдаёт аксессор,
`useActor`/`useMachine` — уже развёрнутый стор.

## Аддоны

```ts
import { createStore } from "@omnifield/probe-web-store";
import { persist } from "@omnifield/probe-web-store/persist";

export const settingsStore = createStore({
  context: { theme: "light" },
  on: { setTheme: (ctx, e: { theme: string }) => ({ theme: e.theme }) },
}).with(persist({ storage: localStorage, key: "settings" }));
```

`./undo` → `store.trigger.undo()`/`.redo()`. `./reset` → `store.trigger.reset()`. `./validate` →
рантайм-проверка событий/контекста по `schemas` конфига.

## Ловушка для тех, кто пишет тесты поверх `./machine`

`@xstate/solid` публикует dual-пакет по конвенции бандлеров — ключ `module` в `exports`,
отдельно от `import`. Vitest-конфиг, который явно перечисляет `resolve.conditions` (как этот
пакет — see `vitest.config.ts`) и забывает включить туда `"module"`, уводит резолв на CJS-ветку
со своим собственным `require("solid-js")` — вторая копия Solid, разорванный владелец,
реактивность внутри `@xstate/solid` тихо не подписывается (без единой ошибки — просто
компонент не обновляется). Замерено 2026-08-28. Настоящим приложениям это не грозит:
`defineConfig()` зоны `build` условия резолва не трогает вовсе, и дефолт Vite (`module` в нём
уже есть) отрабатывает сам.
