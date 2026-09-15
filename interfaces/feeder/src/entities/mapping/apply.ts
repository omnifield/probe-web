import { applyFieldRules, type FieldRule, type RecordIssue } from "@web-core/io";

export interface MappingResult {
  readonly row: Record<string, unknown> | null;
  readonly issues: readonly RecordIssue[];
}

/** Прогоняет правила по ОДНОМУ инстансу варианта А (не пачке — `collectFieldRuleReport` для
 *  массового прогона, тут юзер сводит live-пример, не бэктестит датасет). `source`, который не
 *  объект (например, вариант А был дан просто как схема, без реальных данных) — считается пустым
 *  объектом: `applyFieldRules` сам разберётся, что нечего взять, и отдаст соответствующие issues. */
export function applyMapping(source: unknown, rules: readonly FieldRule[]): MappingResult {
  const record = typeof source === "object" && source !== null ? (source as Record<string, unknown>) : {};
  return applyFieldRules(record, rules);
}
