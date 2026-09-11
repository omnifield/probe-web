import { createAtom } from "@web-core/store";
import { persistAtom } from "@web-core/store/persist";
import { createSignal } from "solid-js";

import type { Endpoint, EndpointHeader, HttpMethod } from "./endpoint";

export const endpointsAtom = persistAtom(createAtom<readonly Endpoint[]>([]), { name: "adapter:endpoints" });

/** Ручка, выбранная для мастеринга в `/lab` — тот же приём выбора, что `currentComponent`
 *  (`entities/component`), только не завязан на маршрут: список ручек живёт в одном райтбаре. */
export const [currentEndpointId, setCurrentEndpointId] = createSignal<string | undefined>();

export function createEndpoint(serviceId: string, tag?: string): Endpoint {
  const endpoint: Endpoint = { id: crypto.randomUUID(), serviceId, tag, method: "GET", url: "", headers: [], body: "" };
  endpointsAtom.set((endpoints) => [...endpoints, endpoint]);
  setCurrentEndpointId(endpoint.id);
  return endpoint;
}

export function removeEndpoint(id: string): void {
  endpointsAtom.set((endpoints) => endpoints.filter((endpoint) => endpoint.id !== id));
  if (currentEndpointId() === id) setCurrentEndpointId(undefined);
}

/** Сервис снесён — сносим и его ручки тем же путём, что `removeEndpoint` (сброс `currentEndpointId`
 *  тоже отрабатывает поштучно, не отдельным филдом). */
export function removeEndpointsOfService(serviceId: string): void {
  for (const endpoint of endpointsAtom.get().filter((one) => one.serviceId === serviceId)) removeEndpoint(endpoint.id);
}

export function endpointsOfService(serviceId: string): readonly Endpoint[] {
  return endpointsAtom.get().filter((endpoint) => endpoint.serviceId === serviceId);
}

export function updateEndpoint(id: string, patch: Partial<Omit<Endpoint, "id" | "serviceId">>): void {
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

export function setEndpointTag(id: string, tag: string | undefined): void {
  updateEndpoint(id, { tag });
}
