import { z } from "@web-core/io";
import { zocker } from "zocker";

import { hintsFor } from "./hints";
import { fakeText, targetLength } from "./text";

// Схема — не компонент: генератору незачем знать имя, паспорт или что-либо ещё о компоненте,
// только форму, по которой строить данные (тот же довод, что у `exampleDataFor`,
// `apps/skin/.mcp/src/kit.ts`). Схемы нет — `undefined`, а не выдуманный объект.
//
// `component` — только ключ подсказок (`hints.ts`), не источник знаний о самом компоненте:
// без подсказки для этого имени генератор ведёт себя ровно как без второго параметра вообще.
export function generateFakeData(schema: z.ZodType | undefined, component: string): unknown {
  if (!schema) return undefined;

  let generator = zocker(schema);

  if (schema instanceof z.ZodObject) {
    const hints = hintsFor(component);
    for (const [field, hint] of Object.entries(hints ?? {})) {
      const fieldSchema = schema.shape[field];
      if (!fieldSchema) continue;
      generator = generator.supply(fieldSchema, () => fakeText(targetLength(hint.length)));
    }
  }

  return generator.generate();
}
