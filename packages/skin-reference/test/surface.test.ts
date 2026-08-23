// НАПРАВЛЕНИЕ ЗАВИСИМОСТИ — одностороннее, и это проверяется, а не обещается.
//
// Эталон знает механику и кит. Механика об эталоне не знает НИЧЕГО — иначе она перестала бы быть
// механикой и стала бы механикой-с-видом, а «нет скина — нет визуала» держалось бы на честном
// слове вместо устройства.
//
// Проверяется по СОБРАННЫМ файлам обеих сторон, а не по исходникам: важно, что попало в поставку
// после разрешения импортов, а не что написано в тексте.

import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const pkgRoot = resolve(import.meta.dirname, "..");

/** Собранный файл поставки как текст. */
function bundle(name: string): string {
  return readFileSync(join(pkgRoot, "dist", name), "utf8");
}

/** Чужие пакеты, которые вход тянет за собой. Из СОБРАННОГО файла, а не из исходника. */
function imports(text: string): string[] {
  return [...new Set([...text.matchAll(/from\s*"([^".][^"]*)"/g)].map((match) => match[1]!))].toSorted();
}

/**
 * Корень пакета по имени — там, где он лежит на самом деле.
 *
 * Идём от разрешённого файла вверх до папки с манифестом: у каждого пакета своя раскладка
 * сборки, и вычислять вход по имени значило бы завести знание о чужой раскладке.
 */
function packageRoot(name: string): string {
  let dir = dirname(require.resolve(name));
  while (!existsSync(join(dir, "package.json"))) dir = dirname(dir);
  return dir;
}

describe("эталон — чистые данные: в поставке ни одного импорта", () => {
  it("собранный файл не тянет за собой НИЧЕГО", () => {
    // Типы записей приходят `import type` и стираются при эмите. Значит потребитель, взявший
    // эталон, не получает вместе с ним ни механики, ни кита: он приносит их сам одноранговыми,
    // теми версиями, что стоят у него. Две копии формы паспорта разъехались бы.
    expect(imports(bundle("index.js"))).toEqual([]);
  });

  it("наружу едут ТРИ ЗАПИСИ и перечень одетых — и больше ничего", async () => {
    const поверхность = await import("../src/index.js");

    expect(Object.keys(поверхность).toSorted()).toEqual([
      "DRESSED",
      "referenceForms",
      "referenceOutfit",
      "referencePalette",
    ]);
  });

  it("механика и кит объявлены ОДНОРАНГОВЫМИ, а обычных зависимостей нет", () => {
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };

    expect(manifest.dependencies).toBeUndefined();
    expect(Object.keys(manifest.peerDependencies ?? {}).toSorted()).toEqual([
      "@omnifield/probe-web-skin",
      "@omnifield/probe-web-ui",
    ]);
  });
});

describe("МЕХАНИКА ОБ ЭТАЛОНЕ НЕ ЗНАЕТ", () => {
  const механика = packageRoot("@omnifield/probe-web-skin");

  it("ни один собранный файл механики нас не упоминает", () => {
    for (const entry of ["index.js", "model.js", "flat.js"]) {
      expect(readFileSync(join(механика, "dist", entry), "utf8")).not.toContain("skin-reference");
    }
  });

  it("и её манифест — тоже: ни зависимостью, ни одноранговой", () => {
    const manifest = readFileSync(join(механика, "package.json"), "utf8");

    expect(manifest).not.toContain("skin-reference");
  });
});
