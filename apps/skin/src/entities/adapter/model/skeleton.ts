export type Skeleton =
  | { readonly type: "string" }
  | { readonly type: "number" }
  | { readonly type: "boolean" }
  | { readonly type: "null" }
  | { readonly type: "array"; readonly items: Skeleton | undefined }
  | { readonly type: "object"; readonly properties: Readonly<Record<string, Skeleton>> };

export function skeletonOf(value: unknown): Skeleton {
  if (value === null || value === undefined) return { type: "null" };

  if (Array.isArray(value)) {
    return { type: "array", items: value.length === 0 ? undefined : skeletonOf(value[0]) };
  }

  if (typeof value === "object") {
    const properties: Record<string, Skeleton> = {};
    for (const [key, item] of Object.entries(value)) properties[key] = skeletonOf(item);
    return { type: "object", properties };
  }

  if (typeof value === "string") return { type: "string" };
  if (typeof value === "number") return { type: "number" };
  if (typeof value === "boolean") return { type: "boolean" };

  return { type: "null" };
}

export interface SkeletonField {
  readonly path: string;
  readonly type: string;
}

function walk(skeleton: Skeleton, path: string): SkeletonField[] {
  if (skeleton.type === "object") {
    return Object.entries(skeleton.properties).flatMap(([key, value]) =>
      walk(value, path === "" ? key : `${path}.${key}`),
    );
  }

  if (skeleton.type === "array") {
    return skeleton.items === undefined ? [{ path: `${path}[]`, type: "unknown" }] : walk(skeleton.items, `${path}[]`);
  }

  return [{ path, type: skeleton.type }];
}

/** Скелет, разложенный в плоский список путей+типов — та же форма показа, что у полей компонента
 *  (`widgets/component/input/schema.ts`'s `fieldsOf`), для парного отображения в мастеринге. */
export function fieldsOfSkeleton(skeleton: Skeleton): readonly SkeletonField[] {
  return walk(skeleton, "");
}
