import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions, ReadonlyAtom } from "@xstate/store";
import { useAtom } from "@xstate/store-solid";
import { createRoot } from "solid-js";
import type { Accessor } from "solid-js";

export interface ActionStoreHelpers<T> {
  readonly setState: Atom<T>["set"];
  readonly get: Atom<T>["get"];
}

type SelectorsShape<T> = Record<string, (state: T) => unknown>;
type SelectorAccessors<T, TSelectors extends SelectorsShape<T>> = {
  readonly [K in keyof TSelectors]: Accessor<ReturnType<TSelectors[K]>>;
};

export interface ActionStore<T, TActions, TSelectors extends SelectorsShape<T> = Record<string, never>>
  extends ReadonlyAtom<T> {
  readonly actions: TActions;
  /** Вычисляемые значения, объявленные при создании стора — живут внутри, не собираются в компоненте. */
  readonly selectors: SelectorAccessors<T, TSelectors>;
  /** Селектор на месте, для разового/нестандартного случая — store.use(selector). */
  use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S>;
}

/**
 * Стор в стиле Zustand/Pinia — состояние плюс объект actions, которым это состояние меняют,
 * без прямого `.set()` наружу (в отличие от `createAtom`, у которого `.set()` публичный).
 *
 * Вычисляемые значения (Pinia-getters) объявляются ТРЕТЬИМ аргументом — `selectorsFactory` —
 * и живут внутри стора как `store.selectors.x()`, реактивный аксессор, готовый сразу; не нужно
 * тащить отдельную функцию-селектор в компонент и собирать стор на месте вызова.
 *
 * Перегрузка различает `selectorsFactory` и `options` по типу третьего аргумента (функция или
 * нет) — тот же приём, что у `createResourceAtom` для keyed/unkeyed вызова.
 *
 * Читается либо `useAtom(store, selector)`/`useSelector` как обычный атом (возвращаемое значение
 * — `ReadonlyAtom<T>`), либо `store.use(selector)` — то же самое, без отдельного импорта.
 * Не сделан вызываемым напрямую (`store(selector)`) — `@xstate/store-solid` отличает атом от
 * конфига по `typeof value === "object"` (`isAtom` в его исходнике); функция этой проверке не
 * пройдёт, и `useAtom(store, selector)` извне перестанет работать. Разбор — FAQ.md.
 */
export function createActionStore<T, TActions extends Record<string, (...args: never[]) => unknown>>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  options?: AtomOptions<T>,
): ActionStore<T, TActions>;
export function createActionStore<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T>,
>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactory: () => TSelectors,
  options?: AtomOptions<T>,
): ActionStore<T, TActions, TSelectors>;
export function createActionStore<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T> = Record<string, never>,
>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactoryOrOptions?: (() => TSelectors) | AtomOptions<T>,
  maybeOptions?: AtomOptions<T>,
): ActionStore<T, TActions, TSelectors> {
  const withSelectors = typeof selectorsFactoryOrOptions === "function";
  const selectorsFactory = withSelectors ? (selectorsFactoryOrOptions as () => TSelectors) : undefined;
  const options = withSelectors ? maybeOptions : (selectorsFactoryOrOptions as AtomOptions<T> | undefined);

  const atom = createAtom<T>(initialValue, options);
  const actions = actionsFactory({ setState: atom.set, get: atom.get });

  const selectors = {} as SelectorAccessors<T, TSelectors>;
  if (selectorsFactory !== undefined) {
    const selectorFns = selectorsFactory();
    createRoot(() => {
      for (const key of Object.keys(selectorFns) as (keyof TSelectors)[]) {
        (selectors as Record<keyof TSelectors, Accessor<unknown>>)[key] = useAtom(atom, selectorFns[key]);
      }
    });
  }

  function use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S> {
    return selector === undefined ? (useAtom(atom) as unknown as Accessor<S>) : useAtom(atom, selector, compare);
  }

  return { get: atom.get, subscribe: atom.subscribe, actions, selectors, use };
}
