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

import { generateSkinCss } from "@omnifield/probe-web-skin";
import { assemble } from "@omnifield/probe-web-skin/model";
import type { SkinSource } from "@omnifield/probe-web-runtime";
import { passportOf } from "@omnifield/probe-web-ui/passport";

import { draftLook, DRAFT_NAME } from "./draft.js";
import { listOutfits, readOutfit, readParts, StoreRefused } from "./store.js";

export { type Draft, DRAFT_NAME, draftLook, held, hold } from "./draft.js";
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
} from "./store.js";

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
      passportOf,
    ),

  // Черновика в перечне НЕТ намеренно: он не выбирается списком, он надевается редактором на
  // время правки. Покажи мы его среди нарядов — человек надел бы чужую незаконченную работу.
};
