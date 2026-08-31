// ПРИМЕР ПО СХЕМЕ (PWEB-187 продолжение, 2026-08-31) — построить запись, ГАРАНТИРОВАННО
// проходящую `schema.safeParse`, читая саму схему, а не подбирая содержимое на глаз (то, чем
// были заготовки из коробки до этого — руками написанные записи, случайно похожие на форму
// одного-двух компонентов и ни на что больше).
//
// Разбор схемы — через `z.toJSONSchema` (Zod 4, рыночный, не наш обход `_def` руками): та же
// причина, по которой JSON Pointer здесь не свой парсер (`packages/io/README.md`) — формат
// разбирает библиотека, мы читаем результат.
//
// СОДЕРЖИМОЕ ЛИСТЬЕВ — НЕ ЭТОГО ФАЙЛА ЗАБОТА. `generateLeaf` приходит параметром: механизм
// (обойти форму) живёт здесь, решение (какой текст в строку) — у вызывающего. Тот же приём
// разделения, что уже держит `compatibleItems`/`BUILTIN_PACKS`: faker — зависимость продукта,
// не фреймворка, и не должна тянуться сюда транзитивно ради одной функции.

import { z } from "zod";

/** Часть JSON Schema, которую `exampleOf` реально читает — остальные поля не наша забота. */
export interface JsonSchemaNode {
  readonly type?: string;
  readonly format?: string;
  readonly enum?: readonly unknown[];
  readonly properties?: Readonly<Record<string, JsonSchemaNode>>;
  readonly required?: readonly string[];
  readonly items?: JsonSchemaNode;
}

/**
 * Строит одно значение для ЛИСТА схемы — не объекта и не массива, а конечного поля.
 *
 * @param node узел JSON Schema этого листа (`type`/`format`/`enum`)
 * @param path путь до него, полями сверху вниз (`["sections", "title"]`) — по имени поля решение
 *   обычно и принимается («label» — фраза, «id» — короткий слаг, и так далее)
 */
export type ExampleLeafGenerator = (node: JsonSchemaNode, path: readonly string[]) => unknown;

/** Сколько элементов класть в массив, когда схема сама не называет длину. */
const ARRAY_LENGTH = 3;

function buildExample(node: JsonSchemaNode, path: readonly string[], generateLeaf: ExampleLeafGenerator): unknown {
  if (node.type === "object" && node.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, propNode] of Object.entries(node.properties)) {
      result[key] = buildExample(propNode, [...path, key], generateLeaf);
    }
    return result;
  }

  if (node.type === "array" && node.items) {
    const items = node.items;
    return Array.from({ length: ARRAY_LENGTH }, (_, index) => buildExample(items, [...path, String(index)], generateLeaf));
  }

  return generateLeaf(node, path);
}

/**
 * Одна запись, ГАРАНТИРОВАННО проходящая `schema.safeParse` — построена ЧТЕНИЕМ схемы, а не
 * подобрана заранее. Необязательные поля тоже заполняются: витрина показывает полную форму, а
 * не минимальную.
 */
export function exampleOf<Schema extends z.ZodType>(schema: Schema, generateLeaf: ExampleLeafGenerator): z.infer<Schema> {
  const jsonSchema = z.toJSONSchema(schema) as JsonSchemaNode;
  return buildExample(jsonSchema, [], generateLeaf) as z.infer<Schema>;
}
