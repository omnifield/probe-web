// Один вопрос — один ответ: лежит ли узел порождённого текста ВНУТРИ слоя каскада.
//
// Вопрос стал общим для трёх проб (`generate`, `mode`, шов с базовым слоем) в тот день, когда
// вне слоя появилось первое содержимое — ответ браузеру о надетой половине (`color-scheme`).
// Три копии обхода предков разъехались бы на первой же правке, а разъехавшись — начали бы
// отвечать по-разному на один и тот же вопрос.

import type { AtRule, Node } from "postcss";

/**
 * Лежит ли узел внутри `@layer`.
 *
 * Смотрим ПРЕДКОВ, а не текст: `@layer` бывает вложенным, и «есть ли слово в строке» отвечает
 * на другой вопрос.
 */
export function inLayer(node: Node): boolean {
  for (let owner: Node | undefined = node.parent; owner; owner = owner.parent) {
    if (owner.type === "atrule" && (owner as AtRule).name === "layer") return true;
  }

  return false;
}
