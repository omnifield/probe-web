import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions, ReadonlyAtom } from "@xstate/store";
import { useAtom } from "@xstate/store-solid";
import type { Accessor } from "solid-js";

export interface ActionStoreHelpers<T> {
  readonly setState: Atom<T>["set"];
  readonly get: Atom<T>["get"];
}

export interface ActionStore<T, TActions> extends ReadonlyAtom<T> {
  readonly actions: TActions;
  /** Зустанд-стиль без импорта useAtom отдельно: store.use(selector). */
  use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S>;
}

/**
 * Стор в стиле Zustand/Pinia — состояние плюс объект actions, которым это состояние меняют,
 * без прямого `.set()` наружу (в отличие от `createAtom`, у которого `.set()` публичный).
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
): ActionStore<T, TActions> {
  const atom = createAtom<T>(initialValue, options);
  const actions = actionsFactory({ setState: atom.set, get: atom.get });

  function use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S> {
    return selector === undefined ? (useAtom(atom) as unknown as Accessor<S>) : useAtom(atom, selector, compare);
  }

  return { get: atom.get, subscribe: atom.subscribe, actions, use };
}
