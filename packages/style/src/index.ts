// Поверхность стилевого слоя. Зависимостей на `ui`, `runtime` и `build` тут нет и быть не
// может: направление зависимостей одностороннее (`kb:PROBEWEB-4`).
//
// CSS через этот вход НЕ идёт: манифест объявляет `sideEffects: false`, и импорт-побочка
// из корня была бы выброшена tree-shaking'ом при первом же неиспользованном экспорте.
// Стили едут отдельными подпутями — `/css` и `/themes.css`.

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
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  PALETTE_TOKENS,
  type PaletteToken,
  THEME_META_TOKENS,
  type ThemeDefinition,
  type ThemeMetaToken,
  type ThemeTokens,
  themeToCss,
} from "./tokens.js";

// Реэкспорт CVA — точка, из которой зона `ui` берёт варианты, не заводя своей копии
// зависимости. Одна зависимость на продукт вместо одной на пакет.
export { cva, type VariantProps } from "class-variance-authority";
