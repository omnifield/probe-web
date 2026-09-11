import { createAtom } from "@web-core/store";
import { createSignal } from "solid-js";

import { removeSchemasOfEndpoint } from "../schema";
import type { Endpoint, EndpointHeader, HttpMethod } from "./endpoint";

const STORAGE_KEY = "adapter:endpoints";

function loadEndpoints(): readonly Endpoint[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? [] : (JSON.parse(raw) as readonly Endpoint[]);
}

export const endpointsAtom = createAtom<readonly Endpoint[]>(loadEndpoints());

endpointsAtom.subscribe((endpoints) => localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints)));

/** Ручка, выбранная для мастеринга в `/lab` — тот же приём выбора, что `currentComponent`
 *  (`entities/component`), только не завязан на маршрут: список ручек живёт в одном райтбаре. */
export const [currentEndpointId, setCurrentEndpointId] = createSignal<string | undefined>();

export function createEndpoint(): Endpoint {
  const endpoint: Endpoint = { id: crypto.randomUUID(), method: "GET", url: "", headers: [], body: "" };
  endpointsAtom.set((endpoints) => [...endpoints, endpoint]);
  setCurrentEndpointId(endpoint.id);
  return endpoint;
}

export function removeEndpoint(id: string): void {
  endpointsAtom.set((endpoints) => endpoints.filter((endpoint) => endpoint.id !== id));
  removeSchemasOfEndpoint(id);
  if (currentEndpointId() === id) setCurrentEndpointId(undefined);
}

export function updateEndpoint(id: string, patch: Partial<Omit<Endpoint, "id">>): void {
  endpointsAtom.set((endpoints) => endpoints.map((endpoint) => (endpoint.id === id ? { ...endpoint, ...patch } : endpoint)));
}

export function setEndpointMethod(id: string, method: HttpMethod): void {
  updateEndpoint(id, { method });
}

export function setEndpointUrl(id: string, url: string): void {
  updateEndpoint(id, { url });
}

export function setEndpointBody(id: string, body: string): void {
  updateEndpoint(id, { body });
}

export function setEndpointHeaders(id: string, headers: readonly EndpointHeader[]): void {
  updateEndpoint(id, { headers });
}
