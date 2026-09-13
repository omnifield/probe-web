// Чистая механика, без сети — тем же разделением, что checkOutfit(outfit, parts): словарь передают,
// а не ходят за ним сами. Сетевой И/О — дело потребителя (apps/skin/.mcp).

export interface TagFlaw {
  readonly name: "unknown-tag";
  readonly where: string;
  readonly means: string;
}

export interface TagGroup {
  readonly tag: string;
  readonly variants: readonly string[];
}

export const DEFAULT_TAG = "default";

// Дефолт первым, дальше по алфавиту — тот же порядок нужен и при сохранении, и при отрисовке.
export function sortTags<T extends string>(tags: readonly T[]): T[] {
  return [...tags].sort((a, b) => {
    if (a === DEFAULT_TAG) return -1;
    if (b === DEFAULT_TAG) return 1;
    return a.localeCompare(b);
  });
}

export function checkTags(tags: readonly string[], knownTags: ReadonlySet<string>, where = "tags"): TagFlaw[] {
  return tags
    .filter((tag) => !knownTags.has(tag))
    .map((tag) => ({
      name: "unknown-tag" as const,
      where,
      means: `тега "${tag}" нет в словаре — заведите его записью kind:"tag" или возьмите существующий из list_presets({kind:"tag"})`,
    }));
}

export interface TaggedName {
  readonly name: string;
  readonly tags: readonly string[];
}

// Переворот variantTags (имя варианта → теги) в массив групп (тег → имена вариантов), отсортированный.
// Принимает и словарь (`Form.variantTags`), и уже плоский список ({name, tags}[], как отдаёт
// `presets/variantsOf`) — вызывающему незачем разворачивать один в другой руками ради вызова.
export function groupByTag(variantTags: Readonly<Record<string, readonly string[]>> | readonly TaggedName[]): TagGroup[] {
  const entries = Array.isArray(variantTags)
    ? variantTags.map((variant): [string, readonly string[]] => [variant.name, variant.tags])
    : Object.entries(variantTags);

  const variantsByTag = new Map<string, string[]>();
  for (const [variant, tags] of entries) {
    for (const tag of tags) {
      const variants = variantsByTag.get(tag) ?? [];
      variants.push(variant);
      variantsByTag.set(tag, variants);
    }
  }
  return sortTags([...variantsByTag.keys()]).map((tag) => ({ tag, variants: variantsByTag.get(tag)! }));
}
