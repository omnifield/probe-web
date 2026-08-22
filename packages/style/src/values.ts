// ПЕРЕЧЕНЬ ПОВЕРХНОСТИ ЗОНЫ. Он же — подпуть `@omnifield/probe-web-style/values`.
//
// ## Зачем этот файл существовал
//
// Подпуть заводился как вход БЕЗ реактивной части (`PWEB-44`): Solid трогал ровно один файл —
// реактивный контроллер темы, — но вход был один, и Solid приезжал всем, включая тех, кому
// нужны только значения. Попалась на этом механика скина: её модель отдаётся подпутём без
// отрисовки, а начала тянуть Solid транзитивно.
//
// ## Чем он стал теперь (`PWEB-56`)
//
// Реактивной части больше нет — у реестра тем не осталось предмета. Solid зоне не нужен вовсе,
// и корневой вход совпал с этим файлом ИМЯ В ИМЯ: `src/index.ts` — один `export *` отсюда.
//
// То есть **повода делить входы больше нет**, и это записано прямо, а не оставлено на догадку:
// две двери к одному и тому же — ровно тот второй источник правды, против которого написано
// остальное в зоне. Снятие подпутя при этом НЕ попутная правка: он уже потребляется
// (`packages/skin`), поэтому сначала потребитель возвращается на корень, потом уходит дверь.
// Решение согласованное, заявка поднята. До него совпадение входов держит `test/entries.test.ts`.
//
// ## Почему перечень живёт ЗДЕСЬ, а не в корне
//
// Пока дверей две, одна из них обязана быть источником, а вторая — реэкспортом. Два перечня
// разъехались бы, и однажды имя оказалось бы в корне, но не в подпути. Источник — этот файл;
// уйдёт подпуть — перечень переедет в корень одним движением.
//
// ## Это ПОВЕРХНОСТЬ, и она замерзает
//
// Что попало сюда, то обещано (`kb:PROBEWEB-4`): каждый экспорт замерзает навсегда.
//
// CSS через этот вход НЕ идёт: манифест объявляет `sideEffects: false`, и импорт-побочка была
// бы выброшена tree-shaking'ом. Стили едут подпутём `/base.css`, порождение — `/generate`.

export {
  CHART_TOKENS,
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
// Имени дефолтной палитры на поверхности НЕТ (`PWEB-50`): своей палитры у зоны не осталось.
// `themeToCss` убран отдельно и раньше (`kb:PROBEWEB-18`, следствие 4) — свободный селектор
// снаружи это второй способ объявить палитру, и правило «палитра принимает имя» держалось бы
// при нём обещанием.
// Имя токена-маркера базы. Наружу — потому что проверять приезд базы будет ЧУЖАЯ механика
// (`runtime`), а имя принадлежит нам: литерал на той стороне — тихая связь, которая переживёт
// переименование и начнёт врать (`kb:PROBEWEB-13`).
export { BASE_MARKER } from "./marker.js";
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
