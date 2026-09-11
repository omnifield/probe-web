import { describeSample } from "@web-core/io";
import { createAtom } from "@web-core/store";
import { persistAtom } from "@web-core/store/persist";

import type { Ref, Schema } from "./schema";

export const schemasAtom = persistAtom(createAtom<readonly Schema[]>([]), { name: "adapter:schemas" });

/** Заводит схему по сырому сэмплу данных под ЛЮБОГО поставщика — эндпоинт, файл, что угодно ещё,
 *  сама схема про поставщика ничего не знает и с ним не работает. `provider` при заведении всегда
 *  один (схема взялась откуда-то конкретно), это подсказка для UI, не идентичность схемы. */
export function createSchema(body: unknown, provider: Ref): Schema {
  const schema: Schema = { id: crypto.randomUUID(), fields: describeSample(body), providers: [provider] };
  schemasAtom.set((schemas) => [...schemas, schema]);
  return schema;
}

export function removeSchema(id: string): void {
  schemasAtom.set((schemas) => schemas.filter((schema) => schema.id !== id));
}

export function updateSchema(id: string, patch: Partial<Pick<Schema, "fields" | "providers">>): void {
  schemasAtom.set((schemas) => schemas.map((schema) => (schema.id === id ? { ...schema, ...patch } : schema)));
}

/** Схемы, у которых этот поставщик числится среди возможных источников — подсказка UI ("я это уже
 *  видел"), не единственный владелец: одну схему может подтвердить не один поставщик. */
export function schemasOfProvider(provider: Ref): readonly Schema[] {
  return schemasAtom
    .get()
    .filter((schema) => schema.providers?.some((one) => one.type === provider.type && one.id === provider.id) ?? false);
}
