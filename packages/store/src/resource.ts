// ОДИН флоу для «стор посчитал/получил значение» — синхронно (из другого атома/функции) или
// асинхронно (по ключу, из службы), потребитель не выбирает приём по типу источника (PROBEWEB-4,
// заявка 2026-09-04). Формат состояния — `{status,data,error}` тот же, что у `createAsyncAtom`
// из `@xstate/store` (совпадает специально, это тот же словарь), но БЕЗ его механизма: апстрим
// отслеживает `.get()` других атомов только в синхронной части геттера (пока идёт `pending`), а
// в момент резолва промиса вызывает `_update(readyValue)` В ОБХОД геттера — `purgeDeps` считает
// все ранее слинкованные атомы недостигнутыми и молча их отвязывает. Итог: атом, получивший
// значение хотя бы раз, больше не реагирует на смену входа, которым сам же был инициирован.
// Подтверждено чтением `store-55b22bbd.js` (bundle 4.2.3) и прямым прогоном без Solid — после
// первого резолва `asyncAtom.deps` пуст, `idAtom.set()` больше не помечает потребителя dirty.
//
// Здесь то же самое достигается без автоматического трекинга: `source` — обычный Solid-аксессор
// (реактивность ведёт Solid, не alien-signals из `@xstate/store`), `fetcher` синхронный ИЛИ
// асинхронный — по значению возврата (`instanceof Promise`), сам атом только пишется через
// `.set()`. Ничего не отслеживается неявно — нечему молча сломаться на резолве.
import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions } from "@xstate/store";
import { createEffect, createRoot } from "solid-js";
import type { Accessor } from "solid-js";

export type ResourceState<Data, Err = unknown> =
  | { status: "pending" }
  | { status: "done"; data: Data }
  | { status: "error"; error: Err };

export interface ResourceFetcherInfo {
  /** Отменяется, когда `source` меняется до того, как этот вызов успел ответить. */
  signal: AbortSignal;
}

/** Без ключа — фетчер пересчитывается ровно один раз, при создании атома (кейс `componentsAtom`). */
export function createResourceAtom<Data>(
  fetcher: (info: ResourceFetcherInfo) => Data | Promise<Data>,
  options?: AtomOptions<ResourceState<Data>>,
): Atom<ResourceState<Data>>;
/** С ключом — пересчитывается каждый раз, когда меняется значение `source` (кейс `componentInfo`). */
export function createResourceAtom<Key, Data>(
  source: Accessor<Key>,
  fetcher: (key: Key, info: ResourceFetcherInfo) => Data | Promise<Data>,
  options?: AtomOptions<ResourceState<Data>>,
): Atom<ResourceState<Data>>;
export function createResourceAtom<Key, Data>(
  sourceOrFetcher: Accessor<Key> | ((info: ResourceFetcherInfo) => Data | Promise<Data>),
  fetcherOrOptions?:
    | ((key: Key, info: ResourceFetcherInfo) => Data | Promise<Data>)
    | AtomOptions<ResourceState<Data>>,
  maybeOptions?: AtomOptions<ResourceState<Data>>,
): Atom<ResourceState<Data>> {
  const keyed = typeof fetcherOrOptions === "function";
  const source: Accessor<Key> = keyed ? (sourceOrFetcher as Accessor<Key>) : (() => undefined as Key);
  const fetcher = keyed
    ? (fetcherOrOptions as (key: Key, info: ResourceFetcherInfo) => Data | Promise<Data>)
    : (_key: Key, info: ResourceFetcherInfo) =>
        (sourceOrFetcher as (info: ResourceFetcherInfo) => Data | Promise<Data>)(info);
  const options = keyed ? maybeOptions : (fetcherOrOptions as AtomOptions<ResourceState<Data>> | undefined);

  const atom = createAtom<ResourceState<Data>>({ status: "pending" }, options);
  let currentController: AbortController | undefined;
  let currentRunId = 0;

  createRoot(() => {
    createEffect(() => {
      const key = source();
      currentController?.abort();
      const controller = new AbortController();
      const runId = ++currentRunId;
      currentController = controller;

      let result: Data | Promise<Data>;
      try {
        result = fetcher(key, { signal: controller.signal });
      } catch (error) {
        atom.set({ status: "error", error });
        return;
      }

      if (!(result instanceof Promise)) {
        atom.set({ status: "done", data: result });
        return;
      }

      atom.set({ status: "pending" });
      result.then(
        (data) => {
          if (runId !== currentRunId || controller.signal.aborted) return;
          atom.set({ status: "done", data });
        },
        (error: unknown) => {
          if (runId !== currentRunId || controller.signal.aborted) return;
          atom.set({ status: "error", error });
        },
      );
    });
  });

  return atom;
}
