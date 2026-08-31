// ИСТОЧНИК ВИДА — то, чем витрина кормит механику надевания.
//
// ## Надевается НАРЯД, а не часть
//
// Палитра и форма по отдельности не надеваются: они части. Человек выбирает наряд, сборка
// складывает его из частей, порождение делает текст, механика приложения его надевает.
//
// ```
// наряд ──► части из службы ──► сборка ──► порождение ──► надет
// ```
//
// ## Сборка — чужая работа, и своей у нас нет
//
// `assemble` живёт в механике скина: она проверяет словарь, полноту палитры, двойные формы и
// отдаёт отчёт. Своей сборки в зоне нет и заводить её нельзя — вторая правда о том, законен ли
// наряд, разошлась бы с первой молча.
//
// ## Валюта — текст стилей, а не адрес файла
//
// Механика приложения принимает источник снаружи и про нас не знает ничего. Ей нужны две вещи:
// перечень имён и ТЕКСТ стилей по имени. Файла с адресом на этом пути нет ни на одном шаге.

import { withPassports } from "@omnifield/probe-web-skin";
import type { SkinSource } from "@omnifield/probe-web-runtime";

import { passportOf } from "../../component/model/providers.js";
import { draftLook, DRAFT_NAME } from "./draft.js";
import { listOutfits, readOutfit, readParts, StoreRefused } from "../api/store.js";
import { wornSkin } from "./worn.js";

export { type Draft, DRAFT_NAME, draftLook, held, hold } from "./draft.js";
export { setWornSkin, wornSkin } from "./worn.js";
export {
  EMPTY_HINT,
  KINDS,
  listOf,
  listOutfits,
  readOutfit,
  readParts,
  remove,
  replace,
  save,
  SERVICE_HINT,
  StoreDown,
  StoreRefused,
  type StoreRecord,
} from "../api/store.js";

// ИСТОЧНИК ПАСПОРТОВ НАЗВАН ЗДЕСЬ ОДИН РАЗ, и дальше едет связкой (`PWEB-94`). У связанных
// вызовов довода для второго источника нет, поэтому проверка наряда и порождение не могут
// разойтись молча: это держит подпись, а не наша договорённость с собой.
const { assemble, generateSkinCss } = withPassports(passportOf);

/**
 * Собирает наряд по имени и отдаёт готовый вид вместе с отчётом сборки.
 *
 * Отчёт нужен витрине не для красоты: в нём перечень одетых компонентов и счёт точечных правок —
 * то, чего ни наряд, ни части по отдельности не знают.
 *
 * @param name имя наряда
 */
export async function assembleOutfit(name: string) {
  const outfit = await readOutfit(name);

  if (!outfit) throw new StoreRefused(`наряда «${name}» в службе нет — надевать нечего`);

  // Изъяны наряда механика отвергает целиком, а не отдаёт вид с ошибкой рядом: вид с изъяном
  // доехал бы до страницы и выглядел там как испорченный, а не как незаконный.
  return assemble(outfit, await readParts());
}

/**
 * Имена вариаций, которые надетый наряд объявил для КОНКРЕТНОГО компонента (PWEB-187
 * продолжение) — то же самое `SlotRecipe.variants` (`packages/skin/src/recipe.ts`), которое
 * порождение читает при сборке CSS, здесь же читается напрямую, ради ИМЁН, не текста стилей.
 *
 * Имена вариаций принадлежат СКИНУ, а не паспорту компонента (та же граница, что у `SlotRecipe`
 * самого) — витрина не имеет права держать свой список, он неизбежно разъедется с надетым при
 * первой же смене наряда. Ничего не надето, либо у наряда нет формы для этого компонента, либо
 * форма не объявила ни одной вариации — честный пустой перечень, не отказ и не выдуманное
 * умолчание.
 *
 * @param component адрес компонента (`data-scope`) — тот же, каким он известен реестру витрины
 */
export async function variantsOf(component: string): Promise<string[]> {
  const name = wornSkin()?.name;
  if (name === undefined) return [];

  const outfit = await readOutfit(name);
  if (!outfit) return [];

  const { forms } = await readParts();
  const names = new Set<string>();
  for (const form of forms) {
    if (form.component !== component || !outfit.forms.includes(form.name)) continue;
    for (const variant of Object.keys(form.recipe.variants ?? {})) names.add(variant);
  }

  return [...names];
}

/**
 * Источник вида для механики надевания.
 *
 * Отказ на неизвестное имя — исключение, а не пустая строка: пустая строка надела бы «наряд»,
 * которого нет, и человек увидел бы голый кит под именем выбранного.
 */
export const SKIN_SOURCE: SkinSource = {
  names: async () => (await listOutfits()).map((item) => item.name),

  css: async (name) =>
    generateSkinCss(
      // ЧЕРНОВИК ЕДЕТ ТЕМ ЖЕ ПУТЁМ, что сохранённый наряд, и это единственная развилка на всём
      // пути. Второй путь до узла — стиль поверх разметки — адресовал бы узел вместо
      // координаты, и правка выглядела бы иначе, чем то, что сохранится.
      (name === DRAFT_NAME ? await draftLook() : await assembleOutfit(name)).skin,
    ),

  // Черновика в перечне НЕТ намеренно: он не выбирается списком, он надевается редактором на
  // время правки. Покажи мы его среди нарядов — человек надел бы чужую незаконченную работу.
};
