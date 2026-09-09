
import type { FluidReport } from "../fluid/index.js";
import type { PassportAssembly } from "../passport/assembly/index.js";
import type { Keyframes, Skin, SkinVariables, SlotRecipe } from "../recipe/index.js";

export interface Palette extends SkinVariables {
  readonly name: string;
}

export interface Form {
  readonly name: string;
  readonly component: string;
  readonly recipe: SlotRecipe;
  readonly keyframes?: Keyframes;
  /** Имя варианта → его теги (`@web-core/skin/tags`), для группировки в свайперах/витрине. */
  readonly variantTags?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Сборка компонента, отданная на хранение — запись рядом с `Form`, а не новый тип сборки.
 *
 * `assembly` — `PassportAssembly` БЕЗ ИЗМЕНЕНИЙ: та же форма, что кодовая сборка кита несёт в
 * `editorInfo.assemblies`. Заведи мы для хранимой сборки свою форму — читателю (`baseAssemblyOf`)
 * пришлось бы разбирать происхождение, а по заявке этого разбора как раз и не должно быть: обе
 * идут через один и тот же вызов, кодовая или сохранённая — не важно.
 */
export interface ComponentAssembly {
  readonly component: string;
  readonly assembly: PassportAssembly;
}

export interface Outfit {
  readonly name: string;
  readonly palette: string;
  readonly forms: readonly string[];
  readonly overrides?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export interface LookParts {
  readonly palettes: readonly Palette[];
  readonly forms: readonly Form[];
}

export type OutfitFlawName =
  | "unknown-palette"
  | "unknown-form"
  | "unknown-component"
  | "outside-vocabulary"
  | "palette-incomplete"
  | "component-twice"
  | "variable-elsewhere"
  | "keyframe-collision";

export interface OutfitFlaw {
  readonly name: OutfitFlawName;
  readonly where: string;
  readonly means: string;
  /** `palette-incomplete` — ПОЛНЫЙ список незакрытых ролей. `means` резюмирует прозой (может
   * усечь для читаемости) — почини по этому полю, не по прозе, где длинный список обрезан "…". */
  readonly missing?: readonly string[];
}

export interface OutfitReport {
  readonly palette: string;
  readonly dressed: readonly string[];
  readonly overrides: number;
  readonly overridesBy: Readonly<Record<string, number>>;
  readonly fluid: readonly FluidReport[];
}

export interface Assembled {
  readonly skin: Skin;
  readonly report: OutfitReport;
}
