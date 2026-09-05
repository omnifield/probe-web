import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions } from "@xstate/store";
import { createEffect, createRoot } from "solid-js";
import type { Accessor } from "solid-js";

export type ResourceState<Data, Err = unknown> =
  | { status: "pending" }
  | { status: "done"; data: Data }
  | { status: "error"; error: Err };

export interface ResourceFetcherInfo {
  signal: AbortSignal;
}

export function createResourceAtom<Data>(
  fetcher: (info: ResourceFetcherInfo) => Data | Promise<Data>,
  options?: AtomOptions<ResourceState<Data>>,
): Atom<ResourceState<Data>>;
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
