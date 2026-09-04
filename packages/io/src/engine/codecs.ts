// см. README.md / FAQ.md — слои L0/L1, оба как `z.codec` (decode/encode через ZodPipe).
import { z } from "zod";

/** L0 — форма источника уже совпадает с паспортом: decode/encode — тождество, разбор всё равно через `schema`. */
export function identityCodec<Schema extends z.ZodType>(
  schema: Schema,
): z.ZodCodec<Schema, Schema> {
  return z.codec(schema, schema, {
    // Каст на границе: generic-код не может статически знать, что output<Schema> === input<Schema>.
    decode: (value) => value as z.input<Schema>,
    encode: (value) => value as z.output<Schema>,
  });
}

/** Обратный словарь. Явный отказ на неоднозначность (два чужих ключа в один наш) — не развернуть без потерь. */
function invert(mapping: Readonly<Record<string, string>>): Record<string, string> {
  const reverse: Record<string, string> = {};
  for (const [theirs, ours] of Object.entries(mapping)) {
    if (Object.hasOwn(reverse, ours)) {
      throw new Error(
        `renameKeysCodec: ключи «${reverse[ours]}» и «${theirs}» оба ведут в «${ours}» — словарь ` +
          `неоднозначен, обратное направление (encode) не восстановить`,
      );
    }
    reverse[ours] = theirs;
  }
  return reverse;
}

function renamed(value: unknown, mapping: Readonly<Record<string, string>>): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[mapping[key] ?? key] = entry;
  }
  return result;
}

/** L1 — структура та же, ключи другие: словарь «их-ключ → наш-ключ», encode строится из него же (`invert`). */
export function renameKeysCodec<A extends z.ZodType, B extends z.ZodType>(
  input: A,
  output: B,
  mapping: Readonly<Record<string, string>>,
): z.ZodCodec<A, B> {
  const reverse = invert(mapping);

  return z.codec(input, output, {
    decode: (theirs) => renamed(theirs, mapping) as z.input<B>,
    encode: (ours) => renamed(ours, reverse) as z.output<A>,
  });
}
