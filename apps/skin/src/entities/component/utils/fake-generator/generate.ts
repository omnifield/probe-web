import { z } from "@web-core/io";
import { zocker } from "zocker";

import { hintsFor } from "./hints";
import { randomPayload } from "./payload";
import { fakeText, targetLength } from "./text";

function hasUnwrap(value: z.ZodType): value is z.ZodType & { unwrap(): z.ZodType } {
  return typeof (value as { unwrap?: unknown }).unwrap === "function";
}

/**
 * Спускается по точечному пути ("items.label") сквозь object/array/optional/nullable до
 * конечного поля — `zocker.supply()` матчит по ссылке на схему, независимо от глубины, так что
 * найти этот объект и есть вся задача. Путь не совпал со схемой (переименовали поле) — `undefined`,
 * подсказка тихо не применяется, а не роняет генерацию.
 */
function resolvePath(schema: z.ZodType, path: string): z.ZodType | undefined {
  let current: z.ZodType = schema;

  for (const segment of path.split(".")) {
    while (!(current instanceof z.ZodObject) && hasUnwrap(current)) current = current.unwrap();
    if (!(current instanceof z.ZodObject)) return undefined;

    const next: z.ZodType | undefined = current.shape[segment];
    if (!next) return undefined;
    current = next;
  }

  return current;
}

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
    for (const [path, hint] of Object.entries(hints ?? {})) {
      const fieldSchema = resolvePath(schema, path);
      if (!fieldSchema) continue;
      generator = generator.supply(fieldSchema, () => fakeText(targetLength(hint.length)));
    }

    // `payload` почти всегда `z.unknown()` — без этого он остаётся пустым. Не по имени компонента,
    // любой компонент с таким полем в схеме.
    const payloadSchema = schema.shape["payload"];
    if (payloadSchema) generator = generator.supply(payloadSchema, () => randomPayload());
  }

  return generator.generate();
}
