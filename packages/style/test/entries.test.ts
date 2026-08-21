import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import * as narrow from "../src/values.js";
import * as root from "../src/index.js";
import * as reactive from "../src/theme.js";

// РАСКЛАДКА ВХОДОВ (`PWEB-44`). Входов два, и различает их ровно одно — нужен ли Solid:
//
//   корневой  — значения, цвет И реактивный контроллер темы;
//   `/values` — то же самое БЕЗ реактивной части.
//
// Гейт здесь не про поставку (это `pack.test.ts`) и не про типизацию у потребителя
// (`types.test.ts`), а про САМО ПРАВИЛО: корень обязан быть суммой узкого входа и реактивного,
// и ничем сверх. Правило, которое держится внимательностью, живёт до первого экспорта,
// дописанного «пока только в корень»: узкий вход обеднел бы молча, и виноватого бы не нашли.

const srcRoot = resolve(import.meta.dirname, "..", "src");

/** Все файлы исходников зоны, рекурсивно. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("корень — это узкий вход плюс реактивное", () => {
  it("ни одного имени в корне мимо узкого входа и контроллера темы", () => {
    const extra = Object.keys(root).filter(
      (name) => !(name in narrow) && !(name in reactive),
    );
    expect(extra, "экспорт корня не пришёл ни из `values.js`, ни из `theme.js`").toEqual([]);
  });

  it("всё, что есть в узком входе, есть и в корне — узкий не богаче", () => {
    const missing = Object.keys(narrow).filter((name) => !(name in root));
    expect(missing, "имя есть в узком входе, но не в корне").toEqual([]);
  });

  it("корень собран реэкспортом, а не вторым перечнем имён", () => {
    // Второй перечень — не стилистика: разъехавшись, он оставил бы имя в корне и не оставил
    // в узком входе. Проверяется ФОРМА файла, потому что проверка по значениям выше видит
    // только рантайм: экспорт ОДНОГО ТИПА в обход `values.js` она бы пропустила.
    const index = readFileSync(join(srcRoot, "index.ts"), "utf8").replace(
      /\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      "",
    );
    const from = [...index.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);

    expect(index).toContain('export * from "./values.js";');
    expect([...new Set(from)].sort()).toEqual(["./theme.js", "./values.js"]);
  });
});

describe("Solid трогает ровно один файл", () => {
  it("`solid-js` импортируется только контроллером темы", () => {
    // Ради этого одного файла в манифесте и стоит одноранговый `solid-js`. Появится второй —
    // узкий вход перестанет быть Solid-free, и узнает об этом потребитель, а не мы.
    const guilty = sources(srcRoot).filter((path) =>
      /from\s+"solid-js/.test(readFileSync(path, "utf8")),
    );

    expect(guilty.map((path) => path.slice(srcRoot.length + 1))).toEqual(["theme.ts"]);
  });

  it("из узкого входа до `solid-js` не дойти — обход по собранным модулям", () => {
    // Обходим ФАКТИЧЕСКИЙ граф поставки, а не исходники: `dist` — это то, что уедет
    // потребителю. Гейт срабатывает ещё до упаковки, поэтому «случайно затянули Solid»
    // краснеет на обычном прогоне, а не на чистой установке.
    const dist = resolve(import.meta.dirname, "..", "dist");
    const seen = new Set<string>();
    const foreign = new Set<string>();

    const walk = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);

      const code = readFileSync(file, "utf8");
      for (const [, specifier] of code.matchAll(/from\s+"([^"]+)"/g)) {
        if (specifier.startsWith(".")) walk(resolve(join(file, ".."), specifier));
        else foreign.add(specifier);
      }
    };

    walk(join(dist, "values.js"));

    expect(seen.size, "обход не нашёл ни одного модуля — путь к `dist` сломан").toBeGreaterThan(5);
    expect([...foreign], "узкий вход тянет чужой модуль").toEqual([]);
  });
});
