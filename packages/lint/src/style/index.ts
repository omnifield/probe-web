// см. README.md / FAQ.md

export type StyleCanonSeverity = "required" | "off";

export interface StyleCanonRule {
  /** Семантический id — общий для любого движка, который однажды реализует канон кодстиля. */
  readonly id: string;
  readonly severity: StyleCanonSeverity;
  /** Что проверяется и почему это дефект, а не вкус — без привязки к формулировкам движка. */
  readonly summary: string;
}

const canon = <const T extends readonly StyleCanonRule[]>(rules: T): T =>
  Object.freeze(rules) as T;

/**
 * Канон кодстиля — отдельно от Solid-канона (`../engine/index.js`): реактивность и порядок
 * импортов не смешиваются в одну карту, у них разные движки (ESLint vs Biome) и разный повод.
 */
export const rules = canon([
  {
    id: "formatting",
    severity: "required",
    summary:
      "Форматирование навязывается машиной, а не привычкой редактора конкретного разработчика — " +
      "в репозитории сегодня это не покрыто ничем (нет Prettier, нет .editorconfig, нет " +
      "закоммиченного .vscode/settings.json), то, что выглядело единым стилем, было личным " +
      "дефолтом IDE.",
  },
  {
    id: "organized-imports",
    severity: "required",
    summary:
      "Импорты сортируются и группируются автоматически. Повод — грязные, несортированные " +
      "импорты в apps/skin/src/widgets/catalogs/ui/list.tsx, которые не ловит ничего в " +
      "репозитории.",
  },
]);
