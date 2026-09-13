import { z } from "@web-core/io";

import type { FieldDescriptor, JsonProp, JsonRoot, ListElementSchema } from "./types.js";

/** `$ref` (самоссылающийся элемент списка, см. `ListElementSchema`) → сам узел из `$defs`.
 *  Обычный узел — как есть, ссылаться ему не на что. */
function resolve(root: JsonRoot, prop: JsonProp): JsonProp {
  if (typeof prop.$ref !== "string") return prop;
  const key = prop.$ref.replace(/^#\/\$defs\//, "");
  return root.$defs?.[key] ?? prop;
}

function leafKind(prop: JsonProp): "string" | "number" | "boolean" | "enum" | undefined {
  if (prop.enum !== undefined && prop.enum.every((value) => typeof value === "string")) return "enum";
  if (prop.type === "string") return "string";
  if (prop.type === "number" || prop.type === "integer") return "number";
  if (prop.type === "boolean") return "boolean";
  return undefined;
}

/** Поля ОДНОГО объектного узла — скаляры (верхний уровень и один уровень вложенных объектов) плюс
 *  `list` для полей-массивов объектов: массив примитивов/`z.unknown()` не рендерится никак —
 *  редактировать там нечего типовым контролом, массив ОБЪЕКТОВ — список форм. */
function fieldsOfNode(root: JsonRoot, node: JsonProp): FieldDescriptor[] {
  if (node.type !== "object" || node.properties === undefined) return [];

  const fields: FieldDescriptor[] = [];
  for (const [key, raw] of Object.entries(node.properties)) {
    const prop = resolve(root, raw);
    const kind = leafKind(prop);
    if (kind !== undefined) {
      fields.push({ path: [key], label: key, kind, options: kind === "enum" ? (prop.enum as string[]) : undefined });
      continue;
    }

    if (prop.type === "array" && prop.items !== undefined) {
      const item = resolve(root, prop.items);
      if (item.type === "object" && item.properties !== undefined) {
        fields.push({ path: [key], label: key, kind: "list", element: { root, node: item } });
      }
      continue;
    }

    if (prop.type === "object" && prop.properties !== undefined) {
      for (const [child, rawChild] of Object.entries(prop.properties)) {
        const childProp = resolve(root, rawChild);
        const childKind = leafKind(childProp);
        if (childKind === undefined) continue;
        fields.push({
          path: [key, child],
          label: `${key}.${child}`,
          kind: childKind,
          options: childKind === "enum" ? (childProp.enum as string[]) : undefined,
        });
      }
    }
  }
  return fields;
}

/**
 * Поля io-схемы компонента целиком — через `z.toJSONSchema` (официальный экспорт zod, не обход
 * `_def`-внутренностей): та же форма, которую библиотека поддерживает как публичный контракт.
 * `unrepresentable: "any"` — схема компонента бывает любой, не всё представимо JSON Schema
 * (например `z.unknown()`), это законный, а не аварийный случай — просто не рендерится полем.
 */
export function fieldsOf(schema: z.ZodType): readonly FieldDescriptor[] {
  let root: JsonRoot;
  try {
    root = z.toJSONSchema(schema, { unrepresentable: "any" }) as JsonRoot;
  } catch {
    return [];
  }
  return fieldsOfNode(root, root);
}

/** Поля ОДНОГО элемента списка (`FieldDescriptor.element`) — тем же обходом, что и `fieldsOf`,
 *  с уже готовым узлом вместо целой схемы. Глубина схемы не ограничена — самоссылающийся элемент
 *  (`children: Item[]` того же вида) снова даёт `kind: "list"`, рекурсия у вызывающего кода. */
export function fieldsOfElement(element: ListElementSchema): readonly FieldDescriptor[] {
  return fieldsOfNode(element.root, element.node);
}

function blankValue(root: JsonRoot, raw: JsonProp): unknown {
  const prop = resolve(root, raw);
  if (prop.enum !== undefined && prop.enum.length > 0) return prop.enum[0];
  if (prop.type === "string") return "";
  if (prop.type === "number" || prop.type === "integer") return 0;
  if (prop.type === "boolean") return false;
  if (prop.type === "array") return [];
  if (prop.type === "object" && prop.properties !== undefined) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(prop.properties)) result[key] = blankValue(root, child);
    return result;
  }
  return undefined;
}

/** Новый элемент списка со значениями по умолчанию по типу (`""`/`0`/`false`/`[]`/первый вариант
 *  enum) — кнопка «Добавить» кладёт его в список, дальше человек правит поля сам. Ходит по тому же
 *  внутреннему дереву (`resolve`/`JsonProp`), что и `fieldsOfElement` — не публичная форма узла,
 *  поэтому живёт здесь, а не в `value.ts` рядом с `valueAt`/`withValue`. */
export function blankElement(element: ListElementSchema): unknown {
  return blankValue(element.root, element.node);
}
