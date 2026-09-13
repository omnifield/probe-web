import { isContent, isDataBinding, type AssemblyTree } from "@web-core/assembly";
import type { z } from "@web-core/io";

/** Узкий срез Standard Schema issue — ровно то, что нужно проекции: сообщение и путь. */
export interface ValidationIssue {
  readonly message: string;
  readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
}

function escapeSegment(segment: PropertyKey): string {
  return String(segment).replace(/~/g, "~0").replace(/\//g, "~1");
}

function keyOf(segment: PropertyKey | { readonly key: PropertyKey }): PropertyKey {
  return typeof segment === "object" ? segment.key : segment;
}

/** JSON Pointer из `issue.path` — та же форма, что `bind`/`value.path` в дереве. */
function pathOf(issue: ValidationIssue): string {
  return "/" + (issue.path ?? []).map((segment) => escapeSegment(keyOf(segment))).join("/");
}

/** Пути, реально забинженные в сборке — тот же обход, что рендер
 *  (`packages/assembly/src/render/props.ts:resolveBind`), только вместо резолва в значение
 *  собирает сами пути. */
function collectBoundPaths(tree: AssemblyTree): ReadonlySet<string> {
  const paths = new Set<string>();

  for (const node of Object.values(tree.components.nodes)) {
    if (isContent(node)) {
      if (isDataBinding(node.value)) paths.add(node.value.path);
      continue;
    }

    for (const path of Object.values(node.bind ?? {})) paths.add(path);
  }

  return paths;
}

/**
 * Проекция дерево×io-схема→валидность. Один вызов Standard Schema на схему сборки ЦЕЛИКОМ, не по
 * листьям независимо — межполевые правила (`z.object(...).superRefine(...)`) живут на уровне
 * схемы и приписывают issue любому пути, не обязательно тому, что проверялось. Issues группируются
 * по пути и режутся до множества, реально забинженного в этом дереве — путь есть в схеме, но не
 * забинжен в этой сборке, значит не участвует.
 */
export function growValidatorLayer(
  tree: AssemblyTree,
  schema: z.ZodType,
  data: unknown,
): Record<string, readonly ValidationIssue[]> {
  const boundPaths = collectBoundPaths(tree);
  const result = schema["~standard"].validate(data);

  if (result instanceof Promise) {
    throw new Error("growValidatorLayer: асинхронные валидаторы (async refine/transform) пока не поддержаны");
  }

  const issues = "issues" in result ? (result.issues as readonly ValidationIssue[] | undefined) ?? [] : [];

  const byPath: Record<string, ValidationIssue[]> = {};
  for (const issue of issues) {
    const path = pathOf(issue);
    if (boundPaths.has(path)) (byPath[path] ??= []).push(issue);
  }

  return byPath;
}
