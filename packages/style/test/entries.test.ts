import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import * as narrow from "../src/values.js";
import * as root from "../src/index.js";

// РАСКЛАДКА ВХОДОВ. Их два, и раньше их различала реактивность: корень вёз её, `/values` нет
// (`PWEB-44`). Реактивной части больше не существует (`PWEB-56`), и различать входы теперь
// НЕЧЕМ — корень совпадает с узким именем в имя.
//
// Это записано здесь пробой, а не заметкой в доке, по двум причинам:
//
//  1. пока двери две, они обязаны оставаться ОДНОЙ дверью. Разъедься они — «взял из корня» и
//     «взял из `/values`» стали бы означать разное, а это ровно тот второй источник правды,
//     против которого написано остальное в зоне;
//  2. совпадение — это и есть довод к тому, чтобы одну дверь убрать. Пусть он будет
//     исполняемым, а не устным: решение согласованное (подпуть уже потребляет `packages/skin`),
//     и до него проба держит вход честным.

const srcRoot = resolve(import.meta.dirname, "..", "src");

/** Все файлы исходников зоны, рекурсивно. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("корень и узкий вход совпадают", () => {
  it("ни одного имени в корне мимо узкого входа", () => {
    const extra = Object.keys(root).filter((name) => !(name in narrow));
    expect(extra, "экспорт корня не пришёл из `values.js`").toEqual([]);
  });

  it("ни одного имени в узком входе мимо корня", () => {
    const missing = Object.keys(narrow).filter((name) => !(name in root));
    expect(missing, "имя есть в узком входе, но не в корне").toEqual([]);
  });

  it("корень — один реэкспорт и больше ничего", () => {
    // Проверяется ФОРМА файла, потому что проверка по значениям выше видит только рантайм:
    // экспорт одного ТИПА в обход `values.js` она бы пропустила.
    const index = readFileSync(join(srcRoot, "index.ts"), "utf8").replace(
      /\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      "",
    );
    const from = [...index.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);

    expect(index).toContain('export * from "./values.js";');
    expect([...new Set(from)]).toEqual(["./values.js"]);
  });
});

describe("Solid зоне не нужен", () => {
  it("`solid-js` не импортирует ни один исходник", () => {
    // Его трогал ровно один файл — реактивный контроллер темы, — и файла больше нет.
    // Появится второй импорт — вернётся и одноранговая зависимость у каждого потребителя.
    const guilty = sources(srcRoot).filter((path) =>
      /from\s+"solid-js/.test(readFileSync(path, "utf8")),
    );

    expect(guilty.map((path) => path.slice(srcRoot.length + 1))).toEqual([]);
  });

  it("`solid-js` не объявлен в манифесте ни одним видом зависимости", () => {
    // Снятая зависимость, оставшаяся в манифесте, — это счёт, который платит каждый
    // потребитель: pnpm доставляет одноранговые сам.
    const manifest = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
    ) as Record<string, Record<string, unknown> | undefined>;

    for (const kind of ["dependencies", "peerDependencies", "peerDependenciesMeta", "devDependencies"]) {
      expect(manifest[kind] ?? {}, `${kind} всё ещё называет solid-js`).not.toHaveProperty(
        "solid-js",
      );
    }
  });

  it("из собранного входа не дойти ни до одного чужого модуля", () => {
    // Обходим ФАКТИЧЕСКИЙ граф поставки, а не исходники: `dist` — это то, что уедет
    // потребителю. Гейт срабатывает до упаковки, поэтому «случайно затянули чужое» краснеет
    // на обычном прогоне, а не на чистой установке.
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

    walk(join(dist, "index.js"));
    walk(join(dist, "values.js"));

    expect(seen.size, "обход не нашёл ни одного модуля — путь к `dist` сломан").toBeGreaterThan(5);
    expect([...foreign], "вход тянет чужой модуль").toEqual([]);
  });
});
