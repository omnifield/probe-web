import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions } from "@xstate/store";
import { createEffect, createRoot } from "solid-js";
import type { Accessor } from "solid-js";

/**
 * Атом, значение которого целиком ведётся внешним Solid-аксессором (проп, другой сигнал) —
 * обвязка createEffect(() => atom.set(source())), а не автотрекинг @xstate/store. Та же форма,
 * что atomEffect/useAtomEffect у Jotai для синка атома с внешним реактивным источником — разбор
 * и источники в FAQ.md.
 */
export function createBoundAtom<T>(source: Accessor<T>, options?: AtomOptions<T>): Atom<T> {
  const atom = createAtom<T>(source(), options);

  createRoot(() => {
    createEffect(() => atom.set(source()));
  });

  return atom;
}
