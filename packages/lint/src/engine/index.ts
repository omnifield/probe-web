// см. README.md / FAQ.md

export type CanonSeverity = "required" | "off";

export interface CanonRule {
  /** Семантический id — общий для любого движка, который однажды реализует канон. */
  readonly id: string;
  readonly severity: CanonSeverity;
  /** Что ловит правило и почему это дефект, а не вкус — без привязки к формулировкам плагина. */
  readonly summary: string;
}
