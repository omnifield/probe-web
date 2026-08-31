// СЛОИ L0/L1 (PWEB-180/182) — тождество и переименование ключей, оба как `z.codec`: один и тот
// же интерфейс (`decode`/`encode`) для любого слоя, от самого дешёвого до самого дорогого —
// вызывающему коду (будущий перебор слоёв снизу вверх) не придётся отличать «это просто схема»
// от «это настоящее преобразование».
//
// `z.codec(A, B, {decode, encode})` — цепочка `ZodPipe`: `decode()` сам разбирает вход схемой
// `A`, зовёт функцию, разбирает результат схемой `B`; `encode()` — то же в обратную сторону.
// Значит здесь пишется только сама функция превращения, а разбор и проверка — уже сделаны.

import { z } from "zod";

/**
 * L0 — форма источника уже совпадает с тем, что объявлено. Тривиальный codec: `decode`/`encode`
 * — тождество, но разбор/проверка/тип всё равно идут через `schema`, раз паспорт уже есть.
 */
export function identityCodec<Schema extends z.ZodType>(
  schema: Schema,
): z.ZodCodec<Schema, Schema> {
  return z.codec(schema, schema, {
    // Каст на границе — тот же случай, что и в `packages/ui/src/button/button.test.tsx`
    // (`selfAssembly as SelfAssembly`): по-настоящему generic-код не может статически знать,
    // что `output<Schema>` и `input<Schema>` совпадают для схемы без внутренних трансформов, —
    // а тождество и есть всё утверждение этой функции целиком.
    decode: (value) => value as z.input<Schema>,
    encode: (value) => value as z.output<Schema>,
  });
}

/**
 * Обратный словарь. Бросает явно на неоднозначность (два чужих ключа в один наш) — такую
 * карту нельзя развернуть без потерь, и молчаливый выбор одного из двух был бы неверен ровно
 * половину раз.
 */
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

/**
 * L1 — структура та же, ключи другие: словарь «их-ключ → наш-ключ» (тем же приёмом, что JSON-LD
 * `@context` — отображение имён это ДАННЫЕ, а не код, написанный руками на каждый случай).
 *
 * Ключи, которых в словаре нет, проезжают под своим именем — отбор лишнего не эта функция, а
 * `output`/`input` схемы: Zod сам не пропускает необъявленное при разборе объектной схемы.
 *
 * `encode` строится из ТОГО ЖЕ словаря автоматически (`invert`) — держать прямой и обратный
 * словари вручную синхронными так же опасно, как вручную дублировать любое другое отображение.
 */
export function renameKeysCodec<A extends z.ZodType, B extends z.ZodType>(
  input: A,
  output: B,
  mapping: Readonly<Record<string, string>>,
): z.ZodCodec<A, B> {
  const reverse = invert(mapping);

  return z.codec(input, output, {
    // Каст на границе тем же доводом, что у `identityCodec` — `renamed()` работает по форме
    // (объект → объект), не по конкретным полям A/B, generic-типом это не выразить.
    decode: (theirs) => renamed(theirs, mapping) as z.input<B>,
    encode: (ours) => renamed(ours, reverse) as z.output<A>,
  });
}
