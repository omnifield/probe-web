// Поверхность стилевого слоя. Зависимостей на `ui`, `runtime` и `build` тут нет и быть не
// может: направление зависимостей одностороннее (`kb:PROBEWEB-4`).
//
// CSS через этот вход НЕ идёт: манифест объявляет `sideEffects: false`, и импорт-побочка
// из корня была бы выброшена tree-shaking'ом при первом же неиспользованном экспорте.
// Стили едут отдельными подпутями — `/base.css` и `/themes.css`.

export { cn } from "./cn.js";
export { createStyle, type VariantFn } from "./create-style.js";
export {
  createThemeController,
  registerTheme,
  type ThemeController,
  type ThemeControllerOptions,
  type ThemeMode,
} from "./theme.js";
export {
  CHART_TOKENS,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  DEFAULT_SEEDS,
  PALETTE_TOKENS,
  SCALE_NAMES,
  SCALE_TOKENS,
  THEME_META_TOKENS,
  buildThemeTokens,
  createTheme,
  type CreateThemeOptions,
  type PaletteToken,
  type ScaleName,
  type ScaleToken,
  type ThemeDefinition,
  type ThemeMetaToken,
  type ThemeSeeds,
  type ThemeTokens,
  themeToCss,
} from "./tokens.js";
// Модель темы и её отрисовка в файл: минимум, который записывают, чтобы вид можно было
// поставить одним указанием. Живёт здесь, а не в зоне производства оформлений (`kb:PROBEWEB-15`).
export { themeModelToCss, type ThemeModel } from "./model.js";
export {
  CHART_SLOTS,
  CONTRAST_PROMISES,
  NO_PROMISE,
  SCALE_STEPS,
  STEP_PURPOSE,
  buildAlphaScale,
  buildChartScale,
  buildScale,
  buildScrim,
  type AlphaKey,
  type AlphaValues,
  type ContrastPromise,
  type ScaleKey,
  type ScaleMode,
  type ScaleStep,
  type ScaleValues,
} from "./scale.js";
export { LAYERS, LAYER_TOKENS, type Layer } from "./layer.js";
export {
  LEGACY_ALIASES,
  LEGACY_TOKENS,
  ROLES,
  ROLE_TOKENS,
  type LegacyAlias,
  type Role,
} from "./roles.js";
export {
  DENSITY_DEFAULT,
  DENSITY_FLOOR,
  DENSITY_NOTE,
  DENSITY_TOKEN,
  DERIVED_SCALES,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  type DerivedScale,
  type DerivedStep,
} from "./dimension.js";

// Контраст наружу — не утилита, а ГЕЙТ, доступный потребителю. Тот, кто ставит свой бренд,
// обязан уметь проверить обещание на своих значениях той же формулой, которой проверяем мы;
// иначе «проверено» у него и у нас означает разное (`kb:PROBEWEB-12`, пункт 4).
export { AA_NON_TEXT, AA_TEXT, contrastRatio } from "./color/contrast.js";
export {
  formatOklch,
  inSrgbGamut,
  oklchToSrgb,
  parseColor,
  srgbToOklch,
  toSrgbGamut,
  type Oklch,
  type Srgb,
} from "./color/oklch.js";

// Реэкспорт CVA — точка, из которой зона `ui` берёт варианты, не заводя своей копии
// зависимости. Одна зависимость на продукт вместо одной на пакет.
export { cva, type VariantProps } from "class-variance-authority";
