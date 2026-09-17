export interface Group<T> {
  /** Тег группы, "" — для нераспределённых (нет тегов на этой оси). */
  readonly label: string;
  readonly items: readonly T[];
}

/** Без фильтра — один плоский бакет, дефолт distributor'а. */
export function noGroup<T>(items: readonly T[]): readonly Group<T>[] {
  return [{ label: "", items }];
}

/** Группировка по тегам — один из поставщиков `Group<T>[]` наравне с `noGroup` (и будущими:
 *  по автору и т.д.). Grid/Matrix потребляют результат, не зная, чем группы порождены. */
export function groupByTags<T>(
  items: readonly T[],
  tagsOf: (item: T) => readonly string[] | undefined,
): readonly Group<T>[] {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const tags = tagsOf(item);
    const keys = tags && tags.length > 0 ? tags : [""];

    for (const key of keys) {
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        buckets.set(key, [item]);
        order.push(key);
      }
    }
  }

  return order.map((label) => ({ label, items: buckets.get(label)! }));
}
