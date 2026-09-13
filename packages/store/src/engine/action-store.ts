import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions, ReadonlyAtom } from "@xstate/store";

export interface ActionStoreHelpers<T> {
  readonly setState: Atom<T>["set"];
  readonly get: Atom<T>["get"];
}

export type ActionStore<T, TActions> = ReadonlyAtom<T> & { readonly actions: TActions };

/**
 * Стор в стиле Zustand/Pinia — состояние плюс объект actions, которым это состояние меняют,
 * без прямого `.set()` наружу (в отличие от `createAtom`, у которого `.set()` публичный).
 * Читается тем же `useAtom`/`useSelector`, что обычный атом — возвращаемое значение и есть
 * `ReadonlyAtom<T>`, только с довеском `actions`.
 */
export function createActionStore<T, TActions extends Record<string, (...args: never[]) => unknown>>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  options?: AtomOptions<T>,
): ActionStore<T, TActions> {
  const atom = createAtom<T>(initialValue, options);
  const actions = actionsFactory({ setState: atom.set, get: atom.get });

  return { get: atom.get, subscribe: atom.subscribe, actions };
}
