// УЗКИЙ ВХОД: значения и цвет БЕЗ реактивной части. Подпуть
// `@omnifield/probe-web-style/values` (`PWEB-44`).
//
// ## Зачем он есть
//
// Корневой вход объявляет Solid одноранговой зависимостью, а трогает Solid ровно ОДИН файл —
// `src/theme.ts`, реактивный контроллер темы. Шкалы, цвет, роли, разбор про Solid не знают
// вовсе. Но вход один, и потому Solid приезжал всем, включая тех, кому нужны только значения.
//
// Кто на этом попался: механика скина отдаёт модель отдельным подпутём БЕЗ отрисовки —
// хранилищу и проверке сохранённого дерева реактивность не нужна. Семена стали частью модели,
// проверка имён зависит от них, и модель начала тянуть Solid транзитивно. Обещание «модель без
// Solid» ослабло не по вине того, кто его давал.
//
// Замером подтверждено, а не выведено из манифеста: чистая установка без `solid-js`, импорт
// корня — `ERR_MODULE_NOT_FOUND: Cannot find package 'solid-js'`. Держит `test/pack.test.ts`,
// и держит В ОБЕ СТОРОНЫ: узкий вход обязан подняться, корневой в той же установке обязан
// упасть. Без второй половины зелёный прогон значил бы и «Solid не нужен», и «проверка не
// дошла до Solid вовсе».
//
// ## Граница проведена по ОДНОМУ признаку
//
// Здесь всё, что не требует Solid, — а не отобранная руками подборка «самого нужного».
// Причина простая: подборку пришлось бы объяснять каждому, кому не хватило слоёв или осей, и
// расширять её по одному имени за выпуск. Правило «узкий вход — это корневой минус
// реактивность» объясняется одной фразой и проверяется машиной.
//
// Отсюда раскладка: перечень живёт ЗДЕСЬ, а корневой вход берёт его целиком и добавляет
// реактивное. Две копии перечня разъехались бы, и однажды имя оказалось бы в корне, но не
// здесь — то есть узкий вход стал бы беднее молча.
//
// ## Это ПОВЕРХНОСТЬ, и она замерзает
//
// Что попало сюда, то обещано наравне с корневым входом (`kb:PROBEWEB-4`): каждый экспорт
// замерзает навсегда. Узкий вход не «черновой» и не «для своих» — он такой же публичный.
//
// CSS через этот вход НЕ идёт, как и через корневой: манифест объявляет `sideEffects: false`,
// и импорт-побочка была бы выброшена tree-shaking'ом. Стили едут подпутями `/base.css` и
// `/themes.css`, порождение — подпутём `/generate` (он и сейчас Solid не тянет).

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
  type PaletteValues,
  type ScaleName,
  type ScaleToken,
  type ThemeDefinition,
  type ThemeMetaToken,
  type ThemeSeeds,
  type ThemeTokens,
} from "./tokens.js";
// Имя дефолтной палитры. `themeToCss` отсюда УБРАН намеренно (`kb:PROBEWEB-18`, следствие 4):
// свободный селектор снаружи — это второй способ объявить палитру, и правило «палитра
// принимает имя» держалось бы при нём обещанием. Публичная дорога ровно одна — имя.
export { DEFAULT_PALETTE } from "./palette.js";
// Имя токена-маркера базы. Наружу — потому что проверять приезд базы будет ЧУЖАЯ механика
// (`runtime`), а имя принадлежит нам: литерал на той стороне — тихая связь, которая переживёт
// переименование и начнёт врать (`kb:PROBEWEB-13`).
export { BASE_MARKER } from "./marker.js";
// Модель темы и её отрисовка в файл: минимум, который записывают, чтобы вид можно было
// поставить одним указанием. Живёт здесь, а не в зоне производства оформлений (`kb:PROBEWEB-15`).
export { DEFAULT_THEME_MODEL, themeModelToCss, type ThemeModel } from "./model.js";
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
// Границы осей: где у значения край и есть ли он. Отдельной таблицей, потому что отсутствие
// границы — тоже ответ, и объявляется он значением, а не умолчанием (`tasker:PROBEWEB-69`).
export { AXES, axisOf, type Axis, type AxisBound, type BoundKind } from "./axes.js";
export {
  DENSITY_CEILING,
  DENSITY_DEFAULT,
  DENSITY_FLOOR,
  DENSITY_NOTE,
  DENSITY_TOKEN,
  DERIVED_SCALES,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  GRID_NOTE,
  GRID_STEP,
  ROUND_FALLBACK_NOTE,
  ROUND_SUPPORT_TEST,
  type DerivedScale,
  type DerivedStep,
} from "./dimension.js";

// Контраст — не утилита, а ГЕЙТ, доступный потребителю. Тот, кто ставит свой бренд, обязан
// уметь проверить обещание на своих значениях той же формулой, которой проверяем мы; иначе
// «проверено» у него и у нас означает разное (`kb:PROBEWEB-12`, пункт 4).
//
// ИМЕННО ПОЭТОМУ второй копии гейта под узкий вход не заводится: два входа — одна формула.
// Разойдись они, «проверено через узкий» и «проверено через корневой» значили бы разное, а
// это ровно тот дефект, от которого гейт и объявлен один.
export { AA_NON_TEXT, AA_TEXT, contrastRatio } from "./color/contrast.js";
export {
  formatOklch,
  inSrgbGamut,
  oklchToSrgb,
  srgbToOklch,
  toSrgbGamut,
  type Oklch,
  type Srgb,
} from "./color/oklch.js";
// Разбор цвета — вход в тот же гейт (`PWEB-42`). Наружу торчат ОБЕ формы, и это не удобство:
// бросающая нужна там, где отказ означает поломку сборки (семя шкалы), не бросающая — там, где
// отказ это запись в перечне, а не остановка. Была бы одна бросающая — потребитель ловил бы
// исключение ради ветвления и терял бы ПРИЧИНУ отказа, а причин две и чинятся они разным.
export { parseColor, tryParseColor, type ColorRefusal, type ParsedColor } from "./color/parse.js";
// Таблица именованных цветов CSS: она же ответ на вопрос «какие имена разбор понимает», и
// спрашивать его перебором не должен никто.
export { NAMED_COLORS, NAMED_COLOR_COUNT } from "./color/named.js";
