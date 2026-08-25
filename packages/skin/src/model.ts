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

// ФОРМА ПАСПОРТА (`PWEB-110`, пересматривает `PWEB-26`) — переехала сюда физически: она общая
// для любого поставщика компонентов, а не привилегия конкретного кита. Разбор критерия и то, что
// НЕ переехало (`PASSPORTS`, `passportOf` — реестр и читатель реестра ЭТОГО кита, остались в
// `@omnifield/probe-web-ui/passport`), — в шапке `passport-form.ts`.
//
// Наружу — тем же подпутём, что и всегда: держатель реестра (кит, продуктовый пакет со своей
// таблицей) объявляет паспорты этими типами и этой функцией, а не своей копией формы.
export type {
  ComponentGroup,
  ComponentPassport,
  PassportAdmission,
  PassportAnatomy,
  PassportComponentGenus,
  PassportGenus,
  PassportMark,
  PassportPart,
  PassportSetting,
  PassportSettingDependency,
  PassportSettingName,
  PassportSettingOption,
  PassportSettings,
  PassportSettingValues,
  PassportSpec,
  PassportState,
  PassportVariable,
  PassportVariantAxis,
} from "./passport-form.js";
export {
  addressesView,
  admits,
  defineSettings,
  definePassport,
  GROUPS,
  groupOf,
  SETTINGS,
  settingApplies,
} from "./passport-form.js";

// БАЗОВАЯ СБОРКА (`PWEB-89`) — переехала вместе с формой: объявление рабочего экземпляра и его
// разворот в плоское дерево не завязаны ни на один конкретный кит.
export type {
  BaseAssemblyContent,
  BaseAssemblyElement,
  BaseAssemblyNode,
  BaseAssemblyTree,
  PassportAssembly,
  PassportAssemblyContent,
  PassportAssemblyNode,
  PassportAssemblyPart,
} from "./passport-assembly.js";
export { baseAssemblyOf, isAssemblyContent, isContentNode } from "./passport-assembly.js";

// ЧИТАТЕЛЬ ПАСПОРТА ПОД ВИД (`PWEB-27`) — мост от живого узла к координате скина, тоже общий для
// любого поставщика.
export type { SkinAncestor, SkinCoordinate } from "./passport-view.js";
export { coordinateOf, partOf } from "./passport-view.js";

export type { PassportLookup } from "./address.js";
// `passportLookup` едет наружу ТЕМ ЖЕ входом, что и тип (`PWEB-95`): место сборки карты одно, и
// объявить это в комментарии, не отдав саму сборку, значило потребовать от каждого держателя
// перечня написать свою карту — ровно то, что запрещено. Держатель перечня теперь связывает
// механику в два хода: `withPassports(passportLookup(PASSPORTS))`.
export {
  ancestorSelector,
  markSelector,
  nodeSelector,
  componentSelector,
  partSelector,
  passportLookup,
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

// ИСТОЧНИК ПАСПОРТОВ НАЗЫВАЕТСЯ ОДИН РАЗ (`PWEB-94`). Проверки скина, правок образца и наряда
// приезжают связанными, а свободных подписей с доводом-источником на поверхности не осталось:
// пока они были, подпись разрешала проверить одним источником, а породить другим. Разбор — в
// `bound.ts`.
export type { BoundModel } from "./bound.js";
export { withPassports } from "./bound.js";

export type { SkinGap, SkinGapKind } from "./coverage.js";
export { skinGaps } from "./coverage.js";

// ГРАНИЦА «ВИД ПРОТИВ ДВИЖЕНИЯ» (`PWEB-99`) — наружу по тому же доводу, что и род запрета
// текучести: редактор обязан сказать человеку ЗАРАНЕЕ, что законно под ненадёжным признаком, а
// разбирать для этого строку отказа ему не с руки. Решение зоны названо в одном месте
// (`motion.ts`), и здесь только его дверь.
export { isMotion, MOTION_FAMILIES } from "./motion.js";

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
export type {
  DimensionSeed,
  FluidBarKind,
  FluidPole,
  FluidRefusal,
  FluidReport,
  FluidSeed,
} from "./fluid.js";
export { fluidBar, fluidExpression, fluidPoles, fluidRefusals, isFluid } from "./fluid.js";

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
export { OutfitRefused } from "./look.js";

// СЛОВАРЬ — машинный контракт между тремя записями. Наружу, потому что его спрашивают все:
// редактор перечисляет роли человеку, хранилище отказывает неполной палитре, проба проверяет.
export type { Role, RoleKind } from "./vocabulary.js";
export { knownRole, ROLE_NAMES, SCALE_ROLES, VOCABULARY } from "./vocabulary.js";
