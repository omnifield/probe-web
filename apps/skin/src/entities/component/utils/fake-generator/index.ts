import type { z } from "@web-core/io";
import { zocker } from "zocker";

// Схема — не компонент: генератору незачем знать имя, паспорт или что-либо ещё о компоненте,
// только форму, по которой строить данные (тот же довод, что у `exampleDataFor`,
// `apps/skin/.mcp/src/kit.ts`). Схемы нет — `undefined`, а не выдуманный объект.
export function generateFakeData(schema: z.ZodType | undefined): unknown {
  return schema ? zocker(schema).generate() : undefined;
}
