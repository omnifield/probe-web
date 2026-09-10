import { z } from "@web-core/io";

export interface SchemaOutlineField {
  readonly path: string;
  readonly type: string;
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

function typeOf(prop: JsonProp): string {
  if (prop.enum !== undefined) return "enum";
  return prop.type ?? "unknown";
}

function walk(root: JsonRoot, prop: JsonProp, path: string, seenRefs: ReadonlySet<string>): SchemaOutlineField[] {
  if (typeof prop.$ref === "string") {
    const key = prop.$ref.replace(/^#\/\$defs\//, "");
    if (seenRefs.has(key)) return [{ path, type: "recursive" }];
    const target = root.$defs?.[key];
    return target === undefined ? [{ path, type: "unknown" }] : walk(root, target, path, new Set([...seenRefs, key]));
  }

  if (prop.type === "object" && prop.properties !== undefined) {
    return Object.entries(prop.properties).flatMap(([key, child]) =>
      walk(root, child, path === "" ? key : `${path}.${key}`, seenRefs),
    );
  }

  if (prop.type === "array") {
    return prop.items === undefined
      ? [{ path: `${path}[]`, type: "unknown" }]
      : walk(root, prop.items, `${path}[]`, seenRefs);
  }

  return [{ path, type: typeOf(prop) }];
}

/** Плоский список путей+типов io-схемы компонента (ключи+типы, без значений) — та же форма показа,
 *  что у скелета API (`entities/adapter`'s `fieldsOfSkeleton`), для парного отображения в
 *  мастеринге адаптера (`entities/adapter/ui/mastering`). */
export function schemaOutline(schema: z.ZodType): readonly SchemaOutlineField[] {
  let root: JsonRoot;
  try {
    root = z.toJSONSchema(schema, { unrepresentable: "any" }) as JsonRoot;
  } catch {
    return [];
  }
  return walk(root, root, "", new Set());
}
