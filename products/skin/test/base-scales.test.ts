// ПРОБА: зона зовёт ступени интервалов теми именами, которые база объявляет СЕЙЧАС.
//
// ЧЕМ ОПЛАЧЕНА. Переименование `kb:PROBEWEB-16`, часть Б: `--space-5…10` стали
// `--space-6/8/12/16/24/32`. Два имени — `--space-6` и `--space-8` — существуют в ОБЕИХ схемах
// с разными значениями: имя выжило, смысл уехал. Из шести мест зоны покраснели только два (те,
// чьи имена исчезли), а четыре промолчали бы и уехали в поставку с чужой величиной: `--space-6`
// значил восемь шагов сетки, а стал шестью.
//
// ПОЭТОМУ ЗДЕСЬ ДВЕ ПРОВЕРКИ, И ВТОРАЯ ВАЖНЕЕ ПЕРВОЙ:
//
//   1. Каждое имя ступени, которое зовёт зона, база объявляет. Ловит ИСЧЕЗНУВШИЕ имена — тот
//      класс, что и так краснеет, но краснеет в другом месте и не по всем исходникам.
//   2. Имя ступени у базы равно множителю. Это контракт, на который первая проверка опирается:
//      пока он держится, «наше имя значит то же, что вчера» — проверяемое утверждение. Стоит
//      базе вернуться к порядковым именам, и первая проверка продолжит проходить, а величины
//      разъедутся молча. Ровно это и произошло бы, не будь переименование разовым.
//
// Список имён здесь НЕ переписан: обе проверки читают шкалу из самой базы. Второй перечень
// разошёлся бы с первым — и разошёлся бы молча, как раз в день такого переименования.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { DERIVED_SCALES } from "@omnifield/probe-web-style";
import { describe, expect, it } from "vitest";

import { ZONE } from "./css.js";

/** Шкала интервалов, как её объявляет база. */
const SPACE = DERIVED_SCALES.find((scale) => scale.seed === "space");

/**
 * Исходники зоны — поставка и площадка, все языки.
 *
 * Пробы сюда не входят намеренно: они называют имена ступеней как ПРИМЕРЫ в пояснениях (в том
 * числе этот файл), и запрет на упоминание превратил бы объяснение в нарушение.
 */
function zoneSources(): { name: string; text: string }[] {
  const out: { name: string; text: string }[] = [];

  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir).sort()) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path, `${prefix}${entry}/`);
      else if (/\.(?:css|ts|tsx)$/.test(entry)) {
        out.push({ name: `${prefix}${entry}`, text: readFileSync(path, "utf8") });
      }
    }
  };

  walk(join(ZONE, "src"), "src/");
  return out;
}

describe("ступени интервалов — имена базы, а не наши воспоминания", () => {
  it("шкала интервалов у базы вообще есть", () => {
    // Обе проверки ниже разбирают чужие данные. Сменит база форму — пробы обязаны упасть
    // здесь, а не молча начать всё пропускать.
    expect(SPACE, "в DERIVED_SCALES нет шкалы `space` — форма данных базы сменилась").toBeDefined();
    expect(SPACE?.steps.length).toBeGreaterThan(0);
  });

  it("имя каждой ступени равно её множителю", () => {
    // Контракт, на который опирается зона: `--space-8` это восемь шагов сетки, и завтра тоже.
    // Порядковое имя (`--space-5` при множителе 6) означало бы, что величину нашего места
    // определяет не имя, а память о том, каким по счёту оно было.
    const lying = (SPACE?.steps ?? [])
      .map((step) => ({ name: step.name, factor: "factor" in step ? step.factor : undefined }))
      .filter(({ name, factor }) => factor === undefined || name !== `space-${factor}`)
      .map(({ name, factor }) => `${name} → множитель ${String(factor)}`);

    expect(lying, "имя ступени разошлось с множителем — наши имена значат не то").toEqual([]);
  });

  it("зона не зовёт ни одной ступени, которой у базы нет", () => {
    const declared = new Set((SPACE?.steps ?? []).map((step) => step.name));

    const unknown = zoneSources().flatMap((file) =>
      [...file.text.matchAll(/--(space-[a-z0-9-]+)/g)]
        .map(([, name]) => name)
        .filter((name) => !declared.has(name))
        .map((name) => `${file.name}: --${name}`),
    );

    expect([...new Set(unknown)], "имена ступеней, которых база не объявляет").toEqual([]);
  });
});
