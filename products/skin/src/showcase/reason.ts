// ПРИЧИНА ОТКАЗА — человеку, а не в отладчик.
//
// Сообщение механики в строку шапки не годится: оно многострочное и с ярлыком пакета. Изъяны при
// этом приезжают перечнем, и берётся ПЕРВЫЙ со счётом остальных: чинить начинают всё равно с
// одного, а весь перечень человек видит в редакторе, где правит запись.
//
// Подсказка про службу тут добавляется РОВНО одному случаю — когда службы и нет. Отказ сборки её
// не получает намеренно: служба жива, а чинится запись или паспорт в ките, и «подними службу»
// увело бы человека не туда.

import { SkinRefused } from "@omnifield/probe-web-skin";
import { OutfitRefused } from "@omnifield/probe-web-skin/model";

import { SERVICE_HINT, StoreDown } from "../skins/index.js";

/** Причина отказа надевания — короткой строкой человеку. */
export function reasonOf(cause: unknown): string {
  if (cause instanceof OutfitRefused || cause instanceof SkinRefused) {
    const [first] = cause.flaws;
    const rest = cause.flaws.length - 1;

    if (first === undefined) return cause.name;

    return `${first.where}: ${first.means}${rest > 0 ? ` · и ещё изъянов: ${rest}` : ""}`;
  }

  if (cause instanceof StoreDown) return `${cause.message} · ${SERVICE_HINT}`;

  return cause instanceof Error ? cause.message : String(cause);
}
