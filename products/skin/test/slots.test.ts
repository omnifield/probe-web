// ПРОБА: реестр зацепок сверен с ОБЕЩАНИЕМ кита, а не с его текущим кодом.
//
// Кит объявил список `data-slot` обязательством: имя из него не меняется и не исчезает без
// мажора (`packages/ui/test/slot-list.ts`). Мы цепляемся ровно за этот список, поэтому проба
// читает его и сверяет с тем, что реально одето.
//
// Ловит два тихих случая:
//   • кит добавил зацепку — у нас появился неодетый примитив, и узнали бы мы об этом от
//     пользователя, а не от прогона;
//   • мы написали правило на имя, которого в обещании нет, — опечатка или опора на то, что
//     кит менять не обязан.
//
// Читается ЧУЖОЙ файл — но только читается. Правка чужой зоны запрещена, чтение нет.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { allSkinCss, stripComments, ZONE } from "./css.js";

/** Обещание зоны `ui` — источник истины по именам зацепок. */
function promisedSlots(): string[] {
  const text = readFileSync(join(ZONE, "..", "..", "packages", "ui", "test", "slot-list.ts"), "utf8");
  const body = text.slice(text.indexOf("PROMISED_SLOTS"));
  return [...body.matchAll(/"([a-z-]+)"/g)].map(([, name]) => name);
}

/** Зацепки, на которые у нас есть правила. */
function dressedSlots(): Set<string> {
  const out = new Set<string>();
  for (const [, name] of stripComments(allSkinCss()).matchAll(/\[data-slot="([a-z-]+)"\]/g)) {
    out.add(name);
  }
  return out;
}

/**
 * Обещанные зацепки, которые зона намеренно НЕ одевает, и почему.
 *
 * Пусто — и это утверждение, а не пробел: первый заход закрывает кит целиком.
 */
const NOT_DRESSED: Record<string, string> = {};

describe("реестр зацепок", () => {
  it("обещание кита прочитано", () => {
    expect(promisedSlots().length).toBeGreaterThan(0);
  });

  it("каждая обещанная зацепка одета либо названа неодетой с причиной", () => {
    const dressed = dressedSlots();
    const undressed = promisedSlots().filter((slot) => !dressed.has(slot) && !(slot in NOT_DRESSED));

    expect(undressed, "зацепки кита, для которых нет правил").toEqual([]);
  });

  it("мы не цепляемся за имена, которых кит не обещал", () => {
    const promised = new Set(promisedSlots());
    const invented = [...dressedSlots()].filter((slot) => !promised.has(slot));

    expect(invented, "имена вне обещания кита").toEqual([]);
  });

  it("список неодетых не расходится с реальностью", () => {
    // Имя, попавшее в исключения и при этом одетое, — забытая запись: она врёт в доке и в
    // отчёте. Ловим сразу, пока список короткий.
    const dressed = dressedSlots();
    const stale = Object.keys(NOT_DRESSED).filter((slot) => dressed.has(slot));

    expect(stale, "числятся неодетыми, а правила есть").toEqual([]);
  });
});
