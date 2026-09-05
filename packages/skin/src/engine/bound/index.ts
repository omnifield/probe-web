
import type { PassportLookup } from "../address/index.js";
import {
  assemble as assembleWith,
  checkOutfit as checkOutfitWith,
  type Assembled,
  type LookParts,
  type Outfit,
  type OutfitFlaw,
} from "../look/index.js";
import type { Skin, SketchEdit } from "../recipe/index.js";
import {
  checkSketch as checkSketchWith,
  checkSkin as checkSkinWith,
  sketchRules as sketchRulesWith,
  skinRules as skinRulesWith,
  type SketchRules,
  type SkinFlaw,
  type SkinRules,
  type ValueVocabulary,
} from "../rules/index.js";

export interface BoundModel {
  checkOutfit(outfit: Outfit, parts: LookParts): readonly OutfitFlaw[];
  assemble(outfit: Outfit, parts: LookParts): Assembled;
  skinRules(skin: Skin, vocabulary?: ValueVocabulary): SkinRules;
  sketchRules(edits: readonly SketchEdit[], vocabulary?: ValueVocabulary): SketchRules;
  checkSkin(skin: Skin, vocabulary?: ValueVocabulary): readonly SkinFlaw[];
  checkSketch(edits: readonly SketchEdit[], vocabulary?: ValueVocabulary): readonly SkinFlaw[];
}

export function withPassports(lookup: PassportLookup): BoundModel {
  return {
    checkOutfit: (outfit, parts) => checkOutfitWith(outfit, parts, lookup),
    assemble: (outfit, parts) => assembleWith(outfit, parts, lookup),
    skinRules: (skin, vocabulary) => skinRulesWith(skin, lookup, vocabulary),
    sketchRules: (edits, vocabulary) => sketchRulesWith(edits, lookup, vocabulary),
    checkSkin: (skin, vocabulary) => checkSkinWith(skin, lookup, vocabulary),
    checkSketch: (edits, vocabulary) => checkSketchWith(edits, lookup, vocabulary),
  };
}
