import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import * as surface from "../src/index.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// ГЕЙТ ПО СУЩЕСТВУ (`PWEB-3`, п. 2–3): наш набор значений — ОДИН ИЗ поставщиков, а не
// фундамент. Оформление, собранное из чужих значений, обязано быть законным.
//
// ВОПРОС ТОТ ЖЕ, ОТВЕЧАЕТ НА НЕГО ДРУГОЕ (`PWEB-56`). Раньше гейт показывал это ПОЛОЖИТЕЛЬНО:
// брал чужие имена, вёз их механикой тем и смотрел, что они следуют за режимом и палитрой. Той
// механики больше нет — реестр тем и контроллер сняты вместе с предметом.
//
// Пробу можно было бы удалить вслед за ними, и это была бы ошибка: исчез ВЕЗУЩИЙ, а
// обязательство осталось. Поэтому она отвечает теперь СИЛЬНЕЕ прежнего — не «чужие значения
// тоже едут», а «зона вообще ничего не кладёт на документ». Фундаментом нельзя быть, не
// прикоснувшись к документу; а раз прикосновения нет ни одного, право чужого набора держится
// построением, а не обещанием.
//
// Кто теперь кладёт значения на документ — скин: его файл объявляет переменные под своими
// именами. Наши имена он вправе не знать вовсе.

const SRC = resolve(import.meta.dirname, "..", "src");

/**
 * Все `.ts` зоны, рекурсивно, с вырезанными комментариями: правило про КОД, а не про прозу в
 * доках — иначе гейт спотыкался бы о собственные объяснения.
 */
function code(dir = SRC): Array<[name: string, text: string]> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return code(path);
    if (!entry.name.endsWith(".ts")) return [];
    const text = readFileSync(path, "utf8").replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
    return [[path.slice(SRC.length + 1), text] as [string, string]];
  });
}

describe("зона не прикасается к документу", () => {
  it("на поверхности нет ни одной функции, которая что-то куда-то ставит", () => {
    // Перечень ЗАПРЕЩЁННОГО здесь не годится: он устареет на первом же новом имени. Смотрим с
    // другой стороны — что вообще торчит наружу, и убеждаемся, что ни одно имя не про DOM.
    const exported = Object.entries(surface).filter(([, value]) => typeof value === "function");
    const names = exported.map(([name]) => name);

    expect(names.length, "поверхность пуста — проба смотрит не туда").toBeGreaterThan(5);
    for (const name of names) {
      expect(
        /register|controller|apply|mount|inject|attach|set[A-Z]/.test(name),
        `${name} похоже на постановщик значений — зона снова трогает документ`,
      ).toBe(false);
    }
  });

  it("ни один исходник зоны не пишет в документ", () => {
    // Вторая сторона: имя может быть каким угодно, а запись всё равно случится. Спрашиваем сам
    // код. `getComputedStyle` и чтение здесь не при чём — ищем именно ЗАПИСЬ.
    const writes = /document\.(head|body|createElement|documentElement)|\.appendChild|\.setAttribute|classList/;

    const guilty = code()
      .filter(([, text]) => writes.test(text))
      .map(([name]) => name);

    expect(guilty, "зона пишет в документ — она снова фундамент, а не поставщик").toEqual([]);
  });

});

describe("наши имена — перечень, а не обязательство", () => {
  it("зона объявляет имена, но не объявляет, что ими надо пользоваться", () => {
    // Перечни на поверхности есть и нужны: по ним потребитель узнаёт, какие имена МЫ считаем
    // ролями. Обязательства в них нет — это словарь, а не анкета, которую обязаны заполнить.
    const ours = new Set<string>([
      ...SCALE_TOKENS,
      ...THEME_META_TOKENS,
      ...ROLE_TOKENS,
      ...LEGACY_TOKENS,
    ]);

    expect(ours.size).toBeGreaterThan(50);
    // Чужие имена не пересекаются с нашими — значит скин на них законен и по составу тоже.
    for (const foreign of ["ink", "paper", "rule", "edge", "skin-surface", "skin-brand"]) {
      expect(ours.has(foreign), `${foreign} — наше имя, пример перестал быть про чужие`).toBe(
        false,
      );
    }
  });
});
