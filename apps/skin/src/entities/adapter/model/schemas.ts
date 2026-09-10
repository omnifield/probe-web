import { createAtom } from "@web-core/store";

import type { Schema } from "./schema";
import { skeletonOf } from "./skeleton";

const STORAGE_KEY = "adapter:schemas";

function loadSchemas(): readonly Schema[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? [] : (JSON.parse(raw) as readonly Schema[]);
}

export const schemasAtom = createAtom<readonly Schema[]>(loadSchemas());

schemasAtom.subscribe((schemas) => localStorage.setItem(STORAGE_KEY, JSON.stringify(schemas)));

export function saveSchema(endpointId: string, body: unknown): Schema {
  const skeleton = skeletonOf(body);
  const existing = schemasAtom.get().find((schema) => schema.endpointId === endpointId);
  const schema: Schema = { id: existing?.id ?? crypto.randomUUID(), endpointId, skeleton };

  schemasAtom.set((schemas) =>
    existing === undefined ? [...schemas, schema] : schemas.map((one) => (one.id === existing.id ? schema : one)),
  );

  return schema;
}

export function schemaOfEndpoint(endpointId: string): Schema | undefined {
  return schemasAtom.get().find((schema) => schema.endpointId === endpointId);
}

export function removeSchemasOfEndpoint(endpointId: string): void {
  schemasAtom.set((schemas) => schemas.filter((schema) => schema.endpointId !== endpointId));
}
