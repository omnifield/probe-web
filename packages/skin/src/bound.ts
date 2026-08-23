// СВЯЗКА С ИСТОЧНИКОМ ПАСПОРТОВ — половина модели (`PWEB-94`).
//
// ## Что здесь закрывается
//
// Проверка наряда и порождение обязаны ходить к ОДНОМУ источнику паспортов. Пока источник был
// доводом КАЖДОГО вызова, подпись разрешала проверить одним, а породить другим:
//
//   assemble(outfit, parts, passportOf)       ← источник назван здесь
//   generateSkinCss(skin, passportOf)         ← и ещё раз здесь
//
// Совпадали они по договорённости, и держал эту договорённость комментарий. Совсем чужой
// источник падает громко (`unknown-component`), а вот два одинаково полных ПО ИМЕНАМ, но разных
// по анатомии или объявленным переменным, расходятся тихо: проверка одобрит переменную по одной
// анатомии, а порождение заадресует по другой — и на странице встанет правило, целящее в
// атрибуты, которых там нет. Вид без вида и без единого изъяна в отчёте.
//
// Здесь источник называется ОДИН РАЗ, и дальше расходиться нечему: у связанных вызовов довода
// для второго источника нет — не по договорённости, а по подписи.
//
// ## Почему связывается ИСТОЧНИК, а не запись
//
// Напрашивалось другое: пусть `Assembled` носит свой источник, а порождение принимает `Assembled`.
// Форма отвергнута замером потребителей: `apps/reference` и пульт разработки держат ГОЛЫЙ `Skin` —
// у одного он написан руками, у другого приезжает из службы пресетов, — и наряда у них нет и быть
// не должно. Требуй мы `Assembled`, они выдумывали бы наряд ради подписи либо получили лазейку
// `Skin → Assembled`, то есть ровно тот второй путь, ради закрытия которого всё и делается.
//
// ## Почему связка живёт в двух местах и почему это ОДНА связка
//
// Здесь — половина модели. Вторая половина (`generate.ts`) — та же связка плюс печать, и она
// собирается ИЗ ЭТОЙ, а не пишется рядом. Ровно то же отношение, что уже объявлено между входами
// пакета: корень — это `./model` плюс порождение. Заведи мы два независимых связывателя, у них
// разъехался бы состав, и «одна дверь» стала бы двумя.
//
// ## Остаток, названный вслух
//
// Два РАЗНЫХ связывания в одном файле (`withPassports(a).assemble(…)` и следом
// `withPassports(b).generateSkinCss(…)`) соберутся: номинальности на экземпляр TypeScript не даёт.
// Но источник в таком коде назван дважды и виден в строке — а требование ровно в этом: назвать
// его один раз.

import type { PassportLookup } from "./address.js";
import {
  assemble as assembleWith,
  checkOutfit as checkOutfitWith,
  type Assembled,
  type LookParts,
  type Outfit,
  type OutfitFlaw,
} from "./look.js";
import type { Skin, SketchEdit } from "./recipe.js";
import {
  checkSketch as checkSketchWith,
  checkSkin as checkSkinWith,
  sketchRules as sketchRulesWith,
  skinRules as skinRulesWith,
  type SketchRules,
  type SkinFlaw,
  type SkinRules,
  type ValueVocabulary,
} from "./rules.js";

/**
 * Механика скина, СВЯЗАННАЯ с источником паспортов: модель без печати.
 *
 * Ровно то, что раньше отдавал подпуть `./model` свободными подписями, — без довода-источника в
 * каждой из них.
 */
export interface BoundModel {
  /** Перечень изъянов наряда — тот же обход, что делает сборка, но значением. */
  checkOutfit(outfit: Outfit, parts: LookParts): readonly OutfitFlaw[];
  /** Сборка наряда в надеваемый вид. Бросает `OutfitRefused` на изъяне. */
  assemble(outfit: Outfit, parts: LookParts): Assembled;
  /** Правила скина в порядке каскада — со всеми изъянами сразу. */
  skinRules(skin: Skin, vocabulary?: ValueVocabulary): SkinRules;
  /** Правила правок образца — тем же обходом, без координаты. */
  sketchRules(edits: readonly SketchEdit[], vocabulary?: ValueVocabulary): SketchRules;
  /** Изъяны скина — тот же обход, без правил. */
  checkSkin(skin: Skin, vocabulary?: ValueVocabulary): readonly SkinFlaw[];
  /** Изъяны правок образца. */
  checkSketch(edits: readonly SketchEdit[], vocabulary?: ValueVocabulary): readonly SkinFlaw[];
}

/**
 * Связывает механику модели с источником паспортов.
 *
 * ```ts
 * import { passportOf } from "@omnifield/probe-web-ui/passport";
 * import { withPassports } from "@omnifield/probe-web-skin/model";
 *
 * const { assemble, checkSkin } = withPassports(passportOf);
 * const { skin, report } = assemble(наряд, части);
 * ```
 *
 * @param lookup чем найти паспорт по имени компонента — ЕДИНСТВЕННОЕ место, где источник назван
 * @returns вызовы модели, у которых второго источника взяться неоткуда
 */
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
