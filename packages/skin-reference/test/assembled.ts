// СОБРАННЫЙ ЭТАЛОН — то, что пробы одевают.
//
// Вид делится на три (`PWEB-78`), и складывает их СБОРКА. Пробы зовут её так же, как позовёт
// приложение: три записи на вход, надеваемый вид и отчёт на выход. Держи мы здесь готовый `Skin`
// — проверялась бы не та дорога, по которой вид приезжает на самом деле.

import { withPassports, type Assembled, type LookParts } from "@omnifield/probe-web-skin";
import { passportOf } from "@omnifield/probe-web-ui/passport";

import { referenceForms, referenceOutfit, referencePalette } from "../src/index.js";

/** Части, из которых собирается эталон: ровно то, что отдаст хранилище. */
export const части: LookParts = { palettes: [referencePalette], forms: referenceForms };

// Источник паспортов называется ОДИН раз и приезжает связкой (`PWEB-94`): проверить наряд одним
// источником, а породить другим — не выражается.
export const { assemble, generateSkinCss } = withPassports(passportOf);

/** Эталон, собранный в надеваемый вид. */
export const собранный: Assembled = assemble(referenceOutfit, части);
