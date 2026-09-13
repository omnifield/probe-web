import type { FieldPath } from "./types.js";

/** Значение по пути — той же формы, что кладёт `fieldsOf`. Путь мимо/узел не объект → `undefined`. */
export function valueAt(data: unknown, path: FieldPath): unknown {
  return path.reduce<unknown>(
    (node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined),
    data,
  );
}

/** Кладёт значение по пути, НЕ мутируя `data` — копируется только цепочка узлов на пути, остальное
 *  делит ссылку с исходным объектом (дёшево для реактивного стора — новая ссылка только там, где
 *  реально что-то изменилось). Путь никогда не проходит ЧЕРЕЗ массив (индексов в нём нет — см.
 *  `FieldPath`), поэтому узел на каждом шаге — всегда объект, спред безопасен. */
export function withValue(data: unknown, path: FieldPath, value: unknown): Record<string, unknown> {
  const [key, ...rest] = path;
  const base = typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {};

  return rest.length === 0 ? { ...base, [key]: value } : { ...base, [key]: withValue(base[key], rest, value) };
}
