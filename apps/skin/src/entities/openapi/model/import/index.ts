import { run } from "@web-core/generators/mapping";

import { createEndpoint, updateEndpoint } from "../endpoint";
import { createService } from "../service";
import type { Service } from "../service";
import { swagger2Template } from "./swagger2";

const templates = [swagger2Template];

/** Диалект спеки не распознан ни одним шаблоном (`run` бросает explicit — см. `packages/generators`
 *  `mapping.run`) — новый сервис не заводится вообще, не тихий пропуск. */
export async function importOpenApiDocument(raw: string): Promise<Service> {
  const { name, endpoints } = await run(raw, templates);

  const service = createService(name);
  for (const endpoint of endpoints) {
    const created = createEndpoint(service.id, endpoint.tag);
    updateEndpoint(created.id, { method: endpoint.method, url: endpoint.url });
  }

  return service;
}
