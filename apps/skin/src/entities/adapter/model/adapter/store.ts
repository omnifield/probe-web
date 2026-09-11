import { createAtom } from "@web-core/store";
import { createSignal } from "solid-js";

import type { Adapter } from "./adapter";

const STORAGE_KEY = "adapter:adapters";

function loadAdapters(): readonly Adapter[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? [] : (JSON.parse(raw) as readonly Adapter[]);
}

// Хранение как персистентного ресурса (CRUD на `backend/presets`) — явно ЗА границей `apps/skin`
// (ROADMAP.yaml, `adapter-schema-resource`/`adapter-child-of-schema`), отдельный трек после того,
// как движок `packages/io` и этот UI устаканятся. Пока — localStorage, тот же приём, что у
// `endpoint/store.ts`/`schema/store.ts`.
export const adaptersAtom = createAtom<readonly Adapter[]>(loadAdapters());

adaptersAtom.subscribe((adapters) => localStorage.setItem(STORAGE_KEY, JSON.stringify(adapters)));

export const [currentAdapterId, setCurrentAdapterId] = createSignal<string | undefined>();

/** Завести пустой адаптер под схему+компонент — правила сведения (`intake`/`emit`) пусты, их
 *  наполняет мастер (`adapter-mapping-ui-wizard`, ещё не сделан). */
export function createAdapter(schemaId: string, component: string): Adapter {
  const adapter: Adapter = { id: crypto.randomUUID(), schemaId, component, intake: [], emit: [] };
  adaptersAtom.set((adapters) => [...adapters, adapter]);
  return adapter;
}

/** Удаляет и адаптер, и его выбор (`currentAdapterId`), если удалён был выбранный — согласуется с
 *  жизненным циклом «дочерний ресурс схемы»: схему снесли — снести и её адаптеры тем же путём. */
export function removeAdapter(id: string): void {
  adaptersAtom.set((adapters) => adapters.filter((adapter) => adapter.id !== id));
  if (currentAdapterId() === id) setCurrentAdapterId(undefined);
}

export function removeAdaptersOfSchema(schemaId: string): void {
  adaptersAtom.set((adapters) => adapters.filter((adapter) => adapter.schemaId !== schemaId));
}

export function updateAdapter(id: string, patch: Partial<Pick<Adapter, "intake" | "emit">>): void {
  adaptersAtom.set((adapters) => adapters.map((adapter) => (adapter.id === id ? { ...adapter, ...patch } : adapter)));
}

export function adaptersOfSchema(schemaId: string): readonly Adapter[] {
  return adaptersAtom.get().filter((adapter) => adapter.schemaId === schemaId);
}

/** Найти адаптер под пару схема+компонент — завести, если его ещё нет. Одна пара — один адаптер. */
export function getOrCreateAdapter(schemaId: string, component: string): Adapter {
  const existing = adaptersAtom.get().find((adapter) => adapter.schemaId === schemaId && adapter.component === component);
  return existing ?? createAdapter(schemaId, component);
}
