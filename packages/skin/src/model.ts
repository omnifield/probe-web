// ПОДПУТЬ `./model` — механика скина БЕЗ порождения: модель, адресация, сборка правил, проверки.
//
// Отдельный вход, а не кусок общего, потому что у этой половины другой потребитель и другая
// цена. Хранилище скинов, проверка сохранённой записи, редактор на стадии «человек ещё правит» —
// им нужны форма и отказы, но не нужен плоский текст CSS. А за текстом стоит postcss с
// `postcss-nested`: влей мы всё в один вход, каждый такой потребитель ставил бы postcss ради
// проверки имени токена.
//
// Обратное неверно: порождение стоит на модели, поэтому корневой вход отдаёт и её тоже.

export type {
  AncestorStyle,
  CompoundVariant,
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
  partSelector,
  safeName,
  stateSelector,
  variantSelector,
} from "./address.js";

export type { SkinFlaw, SkinFlawName, SkinRule, SkinRules, ValueVocabulary } from "./rules.js";
export { checkSketch, checkSkin, sketchRules, skinRules } from "./rules.js";
