// СТЕНД ОДЕТ ЧУЖОЙ ЗОНОЙ, а своего вида не держит.
//
// Предмет этого файла — не вид, а ГРАНИЦА. Пока оформление компонентов жило в стенде, у зоны
// было два источника правды о том, как выглядит таблица: свой и тот, что придёт потребителю.
// Два источника не спорят открыто — они расходятся тихо, и расхождение находят глазами, после
// выпуска. Поэтому вид уехал в `@probe-web/skin` целиком, а здесь стоит сторож, чтобы он не
// вернулся по кусочку.
//
// Возвращается такое всегда одинаково: «тут одно правило, быстро поправить». Одно правило и
// есть начало второго источника.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

const read = (path: string): string => readFileSync(resolve(here, path), "utf8");

const css = (): string => read("../src/playground/playground.css").replace(/\/\*[\s\S]*?\*\//g, "");

describe("одежду подключает скин", () => {
  it("точка входа тянет сборный подпуть одной строкой", () => {
    // Сборный, а не поштучный: он же тянет набор значков, без которого кнопки управления
    // колонкой останутся пустыми квадратами — глифы из них сняты намеренно.
    expect(read("../src/playground/main.tsx")).toContain('import "@probe-web/skin/tables.css";');
  });

  it("зависимость объявлена, и объявлена как СТЕНДОВАЯ", () => {
    // В `devDependencies`, а не в `dependencies`: одежда нужна площадке, а поставка остаётся
    // безголовой. Уехав в `dependencies`, она потащила бы вид каждому потребителю зоны.
    const manifest = JSON.parse(read("../package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(manifest.devDependencies?.["@probe-web/skin"]).toBeDefined();
    expect(manifest.dependencies?.["@probe-web/skin"]).toBeUndefined();
  });
});

describe("своего вида компонентов в стенде нет", () => {
  it("ни одного правила по зацепкам", () => {
    // Селектор по `data-slot` в стенде — это и есть второй источник вида: он цепляется за то
    // же, за что цепляется скин, и спорит с ним в том же каскаде.
    const rules = [...css().matchAll(/[^{}]*\[data-slot[^{}]*\{/g)].map((found) =>
      found[0].trim().replace(/\s+/g, " "),
    );

    expect(rules).toEqual([]);
  });

  it("ни одного текста через `content:`", () => {
    // «Нет поля», «пусто», «скрыто:», звёзды рейтинга — это СОДЕРЖИМОЕ, а не вид: его
    // переводят и читают вслух, а из CSS нельзя ни того, ни другого. Теперь всё это узлы в
    // разметке; вернувшись в `content:`, оно задвоится с ними на экране.
    const texts = [...css().matchAll(/content:\s*(["'])((?:(?!\1).)+)\1/g)].map(
      (found) => found[2]!,
    );

    expect(texts).toEqual([]);
  });
});
