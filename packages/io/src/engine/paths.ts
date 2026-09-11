// см. README.md / FAQ.md — JSON Pointer через `fast-json-patch`, не свой парсер; только дефолтный импорт (см. FAQ.md).
import jsonpatch from "fast-json-patch";
import { z } from "zod";

const { escapePathComponent, getValueByPointer, unescapePathComponent } = jsonpatch;

/** Ссылка на значение — JSON Pointer: `/a/b/0`, пустая строка — сами данные целиком. */
export type FieldRef = string;

export interface Lookup {
  readonly found: boolean;
  readonly value: unknown;
}

/** Найти значение по пути. Не найдено (путь мимо, узел не объект, индекс вне массива) — `found: false`. */
export function lookup(source: unknown, pointer: FieldRef): Lookup {
  if (pointer === "") return { found: true, value: source };

  let value: unknown;
  try {
    value = getValueByPointer(source, pointer);
  } catch {
    // см. FAQ.md — асимметрия библиотеки на промахе глубже первого сегмента выровнена здесь.
    return { found: false, value: undefined };
  }

  return { found: value !== undefined, value };
}

function tokens(pointer: FieldRef): string[] {
  return pointer === "" ? [] : pointer.slice(1).split("/").map(unescapePathComponent);
}

/** Положить значение по пути, достраивая вложенность. МУТИРУЕТ `row` — см. FAQ.md. */
export function assign(row: Record<string, unknown>, pointer: FieldRef, value: unknown): Record<string, unknown> {
  const path = tokens(pointer);
  if (path.length === 0) return row;

  let cursor: Record<string, unknown> = row;
  for (const [index, token] of path.entries()) {
    if (index === path.length - 1) {
      cursor[token] = value;
      break;
    }

    const inner = cursor[token];
    const branch =
      typeof inner === "object" && inner !== null && !Array.isArray(inner)
        ? (inner as Record<string, unknown>)
        : {};

    cursor[token] = branch;
    cursor = branch;
  }

  return row;
}

/** Собрать путь из сегментов с экранированием — обратная сторона разбора. */
export function pointerOf(path: readonly string[]): FieldRef {
  return path.map((name) => `/${escapePathComponent(name)}`).join("");
}

/** Перечислить пути, которые есть в образце данных (для отчёта о непойманных чужих полях). */
export function discoverPaths(sample: unknown, depth = 6): FieldRef[] {
  const found: FieldRef[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (left === 0) return;

    if (Array.isArray(value)) {
      if (value.length > 0) walk(value[0], [...path, "0"], left - 1);
      return;
    }

    if (typeof value === "object" && value !== null) {
      for (const [key, inner] of Object.entries(value)) {
        const next = [...path, key];
        found.push(pointerOf(next));
        walk(inner, next, left - 1);
      }
    }
  };

  walk(sample, [], depth);
  return found;
}

/** Путь + тип одного скалярного листа — общая форма для `describeSample`/`describeSchema`. */
export interface PathType {
  readonly path: FieldRef;
  readonly type: string;
}

/** Перечислить СКАЛЯРНЫЕ листья образца данных (в отличие от `discoverPaths` — без узлов-контейнеров). */
export function describeSample(sample: unknown, depth = 6): PathType[] {
  const found: PathType[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (value === null || value === undefined) {
      found.push({ path: pointerOf(path), type: "null" });
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        found.push({ path: pointerOf(path), type: "unknown" });
        return;
      }
      if (left === 0) return;
      walk(value[0], [...path, "0"], left - 1);
      return;
    }

    if (typeof value === "object") {
      if (left === 0) return;
      for (const [key, inner] of Object.entries(value)) walk(inner, [...path, key], left - 1);
      return;
    }

    if (typeof value === "string") {
      found.push({ path: pointerOf(path), type: "string" });
      return;
    }
    if (typeof value === "number") {
      found.push({ path: pointerOf(path), type: "number" });
      return;
    }
    if (typeof value === "boolean") {
      found.push({ path: pointerOf(path), type: "boolean" });
      return;
    }

    found.push({ path: pointerOf(path), type: "null" });
  };

  walk(sample, [], depth);
  return found;
}

interface JsonSchemaProp {
  readonly type?: string;
  readonly enum?: readonly unknown[];
  readonly properties?: Record<string, JsonSchemaProp>;
  readonly items?: JsonSchemaProp;
  readonly $ref?: string;
}

interface JsonSchemaRoot extends JsonSchemaProp {
  readonly $defs?: Record<string, JsonSchemaProp>;
}

function schemaLeafType(prop: JsonSchemaProp): string {
  if (prop.enum !== undefined) return "enum";
  return prop.type ?? "unknown";
}

/** Перечислить СКАЛЯРНЫЕ листья zod-схемы (через `z.toJSONSchema`) — та же форма, что `describeSample`,
 *  но вход не сэмпл данных, а описание формы. `$ref`-цикл → `"recursive"`, схема не сериализуется → `[]`. */
export function describeSchema(schema: z.ZodType, depth = 6): PathType[] {
  let root: JsonSchemaRoot;
  try {
    root = z.toJSONSchema(schema, { unrepresentable: "any" }) as JsonSchemaRoot;
  } catch {
    return [];
  }

  const found: PathType[] = [];

  const walk = (prop: JsonSchemaProp, path: string[], seenRefs: ReadonlySet<string>, left: number): void => {
    if (typeof prop.$ref === "string") {
      const key = prop.$ref.replace(/^#\/\$defs\//, "");
      if (seenRefs.has(key)) {
        found.push({ path: pointerOf(path), type: "recursive" });
        return;
      }
      const target = root.$defs?.[key];
      if (target === undefined) {
        found.push({ path: pointerOf(path), type: "unknown" });
        return;
      }
      walk(target, path, new Set([...seenRefs, key]), left);
      return;
    }

    if (prop.type === "object" && prop.properties !== undefined) {
      if (left === 0) return;
      for (const [key, child] of Object.entries(prop.properties)) walk(child, [...path, key], seenRefs, left - 1);
      return;
    }

    if (prop.type === "array") {
      if (prop.items === undefined) {
        found.push({ path: pointerOf(path), type: "unknown" });
        return;
      }
      if (left === 0) return;
      walk(prop.items, [...path, "0"], seenRefs, left - 1);
      return;
    }

    found.push({ path: pointerOf(path), type: schemaLeafType(prop) });
  };

  walk(root, [], new Set(), depth);
  return found;
}
