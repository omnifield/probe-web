export * from "@xstate/store/persist";

import type { Atom } from "@xstate/store";
import { createJSONStorage } from "@xstate/store/persist";
import type { StateStorage } from "@xstate/store/persist";

export interface PersistAtomOptions<T> {
  /** Ключ в storage. */
  name: string;
  /** Синхронный адаптер (localStorage/sessionStorage через `createJSONStorage`). По умолчанию — localStorage. */
  storage?: StateStorage;
  /** Кастомный сериализатор. По умолчанию — `JSON.stringify`. */
  serialize?: (value: T) => string;
  /** Кастомный десериализатор. По умолчанию — `JSON.parse`. */
  deserialize?: (raw: string) => T;
}

/**
 * Гидрирует атом из storage при вызове и подписывает его на запись при каждом изменении —
 * то, что `persist` даёт `createStore` через `.with()`, но для `createAtom` (у атома нет `.with`).
 * `storage` синхронный (localStorage/sessionStorage) — асинхронные адаптеры (IndexedDB) не
 * поддержаны: `getItem`, вернувший не строку (в т.ч. Promise), гидратацию не запускает.
 */
export function persistAtom<T>(atom: Atom<T>, options: PersistAtomOptions<T>): Atom<T> {
  const storage = options.storage ?? createJSONStorage(() => localStorage);
  const serialize = options.serialize ?? ((value: T) => JSON.stringify(value));
  const deserialize = options.deserialize ?? ((raw: string) => JSON.parse(raw) as T);

  const raw = storage.getItem(options.name);
  if (typeof raw === "string") atom.set(deserialize(raw));

  atom.subscribe((value) => storage.setItem(options.name, serialize(value)));

  return atom;
}
