import { createAtom } from "@web-core/store";
import { persistAtom } from "@web-core/store/persist";
import { removeEndpointsOfService } from "../endpoint";
import type { Service } from "./service";

export const servicesAtom = persistAtom(createAtom<readonly Service[]>([]), {
  name: "adapter:services",
});

export function createService(name: string): Service {
  const service: Service = { id: crypto.randomUUID(), name };
  servicesAtom.set((services) => [...services, service]);
  return service;
}

/** Сервис — родитель ручек (`Endpoint.serviceId`), снос каскадный, тем же приёмом, что
 *  `removeAdaptersOfSchema` у адаптера. */
export function removeService(id: string): void {
  servicesAtom.set((services) =>
    services.filter((service) => service.id !== id),
  );
  removeEndpointsOfService(id);
}

export function updateService(
  id: string,
  patch: Partial<Omit<Service, "id">>,
): void {
  servicesAtom.set((services) =>
    services.map((service) =>
      service.id === id ? { ...service, ...patch } : service,
    ),
  );
}
