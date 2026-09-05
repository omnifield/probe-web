export * from "@xstate/store-solid";

export { createResourceAtom } from "./resource.js";
export type { ResourceFetcherInfo, ResourceState } from "./resource.js";

// Переопределяет createAsyncAtom из реэкспорта выше — разбор в FAQ.md.
export function createAsyncAtom(): never {
  throw new Error(
    "createAsyncAtom не работает с реактивными зависимостями — используйте createResourceAtom из этого пакета (см. FAQ.md)",
  );
}
