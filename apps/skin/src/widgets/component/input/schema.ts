import { z } from "@web-core/io";

/** Путь до поля — сегменты ключей. Внутри ОДНОГО объекта (запись целиком или один элемент
 *  списка) — глубина 1 (верхний уровень) или 2 (внутри вложенного объекта); индексы массива в
 *  путь никогда не попадают — `list`-поля меняются целиком (см. `ListField` в `fields.tsx`), не
 *  точечным путём внутрь элемента. */
export type FieldPath = readonly string[];

/** Схема ОДНОГО элемента списка — непрозрачный дескриптор для `fieldsOfElement`/`blankElement`,
 *  несёт JSON-Schema узел элемента и корень документа (нужен для разрешения `$ref` — канонический
 *  `item` (`packages/ui/src/shared/data/fields.ts`) рекурсивный: `children` — массив ТАКИХ ЖЕ
 *  элементов, в JSON Schema это `$ref` на тот же `$defs`-узел). */
export interface ListElementSchema {
  readonly root: JsonRoot;
  readonly node: JsonProp;
}

export interface FieldDescriptor {
  readonly path: FieldPath;
  /** Человеку — путь через точку (`recipe.variant`), схема этого приложения имён полей не хранит. */
  readonly label: string;
  readonly kind: "string" | "number" | "boolean" | "enum" | "list";
  /** Только у `kind: "enum"`. */
  readonly options?: readonly string[];
  /** Только у `kind: "list"` — схема одного элемента, для `fieldsOfElement`/`blankElement`. */
  readonly element?: ListElementSchema;
}

interface JsonProp {
  readonly type?: string;
  readonly enum?: readonly unknown[];
  readonly properties?: Record<string, JsonProp>;
  readonly items?: JsonProp;
  readonly $ref?: string;
}

interface JsonRoot extends JsonProp {
  readonly $defs?: Record<string, JsonProp>;
}

/** `$ref` (самоссылающийся `item.children`, см. `ListElementSchema`) → сам узел из `$defs`.
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

/** Поля ОДНОГО объектного узла — скаляры (верхний уровень и один уровень вложенных объектов, тот
 *  же охват, что был в первом заходе `input-widget-real-ui`) плюс `list` для полей-массивов
 *  объектов (новое, `input-nested-fields-engine`): массив примитивов/`z.unknown()` не рендерится
 *  никак — редактировать там нечего своим контролом, массив ОБЪЕКТОВ — список форм. */
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
 * `_def`-внутренностей): та же форма, которую библиотека поддерживает как публичный контракт, не
 * завязка на приватности версии. `unrepresentable: "any"` — схема компонента бывает любой, не всё
 * представимо JSON Schema (например `z.unknown()`), это законный, а не аварийный случай.
 */
export function fieldsOf(schema: z.ZodType): readonly FieldDescriptor[] {
  let root: JsonRoot;
  try {
    root = z.toJSONSchema(schema, { unrepresentable: "any" }) as JsonRoot;
  } catch {
    // Схема — внешняя граница (описана в ките, не здесь): непредставимая целиком схема просто
    // остаётся без формы полей, а не роняет виджет.
    return [];
  }
  return fieldsOfNode(root, root);
}

/** Поля ОДНОГО элемента списка (`FieldDescriptor.element`) — тем же обходом, что и `fieldsOf`,
 *  просто с уже готовым узлом вместо целой схемы компонента. У канонического `item` это `value`/
 *  `label` (скаляры) и `children` (снова `list` — отсюда рекурсия в `ListField`, глубина схемы не
 *  ограничена, глубина РЕАЛЬНЫХ данных — сколько элементов реально вложено). */
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
 *  enum) — кнопка "Добавить" кладёт его в список, дальше человек правит поля сам. */
export function blankElement(element: ListElementSchema): unknown {
  return blankValue(element.root, element.node);
}

/** Значение по пути — той же формы, что кладёт `fieldsOf`. Путь мимо/узел не объект → `undefined`. */
export function valueAt(data: unknown, path: FieldPath): unknown {
  return path.reduce<unknown>(
    (node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined),
    data,
  );
}

/** Кладёт значение по пути, НЕ мутируя `data` — копируется только цепочка узлов на пути, остальное
 *  делит ссылку с исходным объектом (важно для сигналов Solid: новая ссылка на каждом уровне).
 *  Путь никогда не проходит ЧЕРЕЗ массив (индексов в нём нет — см. `FieldPath`), поэтому узел на
 *  каждом шаге — всегда объект, спред безопасен. */
export function withValue(data: unknown, path: FieldPath, value: unknown): Record<string, unknown> {
  const [key, ...rest] = path;
  const base = typeof data === "object" && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : {};

  return rest.length === 0 ? { ...base, [key]: value } : { ...base, [key]: withValue(base[key], rest, value) };
}
