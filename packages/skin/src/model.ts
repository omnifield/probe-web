// ПОДПУТЬ `./model` — механика скина БЕЗ порождения: модель, адресация, сборка правил, проверки.
//
// Отдельный вход, а не кусок общего, потому что у этой половины другой потребитель: хранилищу
// скинов, проверке сохранённой записи и редактору на стадии «человек ещё правит» нужны форма и
// отказы, а печатать текст им нечего и незачем.
//
// Обратное неверно: порождение стоит на модели, поэтому корневой вход отдаёт и её тоже.
//
// Оба этих входа postcss не тянут — он живёт за третьим, `./flat` (`PWEB-36`).

export type {
  AncestorStyle,
  CompoundVariant,
  ScaleDeclaration,
  SeededScale,
  Keyframes,
  LocalStyle,
  PartStyle,
  PartStyles,
  Skin,
  SketchEdit,
  SkinVariables,
  SlotRecipe,
  StyleObject,
  StyleValue,
} from "./recipe.js";

export {
  DARK_CLASS,
  FORCE_ATTRIBUTE,
  LAYER_ORDER,
  NODE_ATTRIBUTE,
  SKETCH_LAYER,
  SKIN_LAYER,
} from "./marks.js";

export type { PassportLookup } from "./address.js";
export {
  ancestorSelector,
  markSelector,
  nodeSelector,
  componentSelector,
  partSelector,
  safeName,
  stateSelector,
  variantSelector,
} from "./address.js";

export type {
  CssRule,
  RuleCoordinate,
  SkinFlaw,
  SkinFlawName,
  SkinRule,
  SkinRules,
  SketchRules,
  ValueVocabulary,
} from "./rules.js";
export { checkSketch, checkSkin, sketchRules, skinRules } from "./rules.js";

export type { SkinGap, SkinGapKind } from "./coverage.js";
export { skinGaps } from "./coverage.js";

// Значения скина: построение семенами и то, чем правка человека помечена. Живёт в `./model`,
// потому что это МОДЕЛЬ — от неё зависят и проверка имён, и порождение, и читаемость. Цена
// названа: построение шкал берётся у зоны значений, и она приезжает сюда одноранговой.
export type { SkinHalf, SkinValue, ValueOrigin } from "./seeds.js";
export { NOT_SEEDED, skinValues, valueNames } from "./seeds.js";
// Размерные шкалы: второй ряд посеваемого. Наружу — потому что редактор и хранилище спрашивают
// то же самое, что и порождение: какие семена законны и что скин объявляет на самом деле.
export type { SizeRefusal, SizeSeed } from "./sizes.js";
export { SIZE_SEEDS, sizeRefusals, sizeValues } from "./sizes.js";

// ТЕКУЧИЙ РАЗМЕР (`PWEB-80`): семя объявляется полюсами, выражение печатает механика. Наружу —
// потому что спрашивают все: редактор показывает человеку края, хранилище проверяет запись,
// проба сверяет вычисленное.
export type { DimensionSeed, FluidPole, FluidRefusal, FluidReport, FluidSeed } from "./fluid.js";
export { fluidExpression, fluidPoles, fluidRefusals, isFluid } from "./fluid.js";

// ВИД ДЕЛИТСЯ НА ТРИ (`PWEB-78`): палитра, форма, наряд — записи, складываемые ПРИ НАДЕВАНИИ.
// `Skin` от этого не снят: он стал тем, что сборка производит. Разбор — в `look.ts`.
export type {
  Assembled,
  Form,
  LookParts,
  Outfit,
  OutfitFlaw,
  OutfitFlawName,
  OutfitReport,
  Palette,
} from "./look.js";
export { assemble, checkOutfit, OutfitRefused } from "./look.js";

// СЛОВАРЬ — машинный контракт между тремя записями. Наружу, потому что его спрашивают все:
// редактор перечисляет роли человеку, хранилище отказывает неполной палитре, проба проверяет.
export type { Role, RoleKind } from "./vocabulary.js";
export { knownRole, ROLE_NAMES, SCALE_ROLES, VOCABULARY } from "./vocabulary.js";
