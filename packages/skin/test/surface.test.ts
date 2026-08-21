// ПОВЕРХНОСТЬ ПОСТАВКИ — обещание подпутей, проверенное по СОБРАННОМУ файлу, а не по намерению.
//
// Обещание одно и стоит денег потребителю: порождение отдаёт ВЛОЖЕННУЮ форму и postcss в цепочку
// не тянет — витрина и редактор порождают CSS на каждое движение ручки, и разворачиватель был
// там главным весом.
//
// Проверить это можно только тем, что уехало в `dist`: исходник об этом не говорит — важно, что
// попало в бандл после разрешения импортов.
//
// Проба идёт после сборки: `pnpm test` собирает пакет первым шагом.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Собранный файл поставки как текст. */
function bundle(name: string): string {
  return readFileSync(join(pkgRoot, "dist", name), "utf8");
}

/** Манифест пакета. */
const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  exports: Record<string, { types: string; default: string }>;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
};

/** Чужие пакеты, которые вход тянет за собой. Из СОБРАННОГО файла, а не из исходника. */
function imports(name: string): string[] {
  return [
    ...new Set(
      [...bundle(name).matchAll(/from\s*"([^".][^"]*)"/g)].map((match) => match[1]!),
    ),
  ].toSorted();
}

describe("что каждый вход тянет за собой", () => {
  // Проверяется РЕБРО, а не наличие подстроки: перечень целиком, а не «содержит». Подросший
  // молча импорт — это ровно то, чего проба обязана не пропустить, и обнаруживается он только
  // сравнением всего списка.

  it("корень: кит и набор значений, и ни следа postcss", () => {
    expect(imports("index.js")).toEqual([
      "@omnifield/probe-web-style",
      "@omnifield/probe-web-ui/passport",
    ]);
  });

  it("`./model`: то же самое — построение семенами это МОДЕЛЬ", () => {
    // Набор значений приехал сюда за построением шкал (`PWEB-43`): семена — часть записи скина,
    // и от них зависит уже проверка имён, а не только порождение. Своего построения заводить
    // было нельзя — оно объявлено гейтом там.
    //
    // Цена названа честно: корень зоны значений тянет за собой Solid, значит `./model` больше
    // не годится там, где Solid не поставлен. Узкий подпуть с гейтом без Solid запрошен у
    // соседа отдельной заявкой.
    expect(imports("model.js")).toEqual([
      "@omnifield/probe-web-style",
      "@omnifield/probe-web-ui/passport",
    ]);
  });

  it("`./flat`: только разворот, и ничего из зоны", () => {
    expect(imports("flat.js")).toEqual(["postcss", "postcss-nested"]);
  });

  it("`./flat` отдаёт ТОЛЬКО разворот: широкий вход вернул бы postcss всем", async () => {
    const flat = await import("../src/flat.js");

    expect(Object.keys(flat)).toEqual(["flattenCss"]);
  });

  it("читаемость — в корне, а не в `./model`", async () => {
    const root = await import("../src/index.js");
    const model = await import("../src/model.js");

    expect(typeof root.skinContrast).toBe("function");
    expect("skinContrast" in model).toBe(false);
  });

  it("покрытие и значения — в `./model`: хранилищу они нужны, а конвейер CSS нет", async () => {
    const model = await import("../src/model.js");

    expect(typeof model.skinGaps).toBe("function");
    expect(typeof model.skinValues).toBe("function");
  });
});

describe("что уезжает, а что остаётся", () => {
  it("все три подпути объявлены и указывают на собранные файлы", () => {
    expect(Object.keys(manifest.exports)).toEqual([".", "./model", "./flat"]);
    for (const name of ["index", "model", "flat"]) {
      expect(() => bundle(`${name}.js`)).not.toThrow();
      expect(() => bundle(`${name}.d.ts`)).not.toThrow();
    }
  });

  it("в поставке ровно разворачиватель вложенного и его основание — больше ничего", () => {
    // Замер 2026-08-20: `@pandacss/core` вокруг той же утилиты — 9,0 МБ и 33 пакета против
    // 1,1 МБ и 8. Перечень сравнивается целиком, а не «содержит»: молча подросший список
    // зависимостей — это и есть то, чего проба обязана не пропустить.
    expect(Object.keys(manifest.dependencies).toSorted()).toEqual(["postcss", "postcss-nested"]);
  });

  it("кит и набор значений объявлены ОДНОРАНГОВЫМИ, а не обычными", () => {
    // Кит — потому что две копии формы паспорта в дереве разъедутся молча (`PWEB-27`). Набор
    // значений — потому что взята его формула-ГЕЙТ, и «проверено» у нас и у того, кто ставит
    // свой бренд, обязано означать одно и то же.
    expect(Object.keys(manifest.peerDependencies).toSorted()).toEqual([
      "@omnifield/probe-web-style",
      "@omnifield/probe-web-ui",
    ]);
  });

  it("ни Solid, ни отрисовки в поставке нет: механика превращает данные в текст", () => {
    for (const name of ["index.js", "model.js"]) {
      expect(bundle(name)).not.toContain("solid-js");
    }
  });
});

describe("второго генератора нет", () => {
  it("поверхность знает одно порождение скина и одно — правок образца", async () => {
    const surface = await import("../src/index.js");
    const generators = Object.keys(surface).filter((name) => name.startsWith("generate"));

    expect(generators.toSorted()).toEqual(["generateSketchCss", "generateSkinCss"]);
  });

  it("отдельного «порождения для предпросмотра» на поверхности не появилось", async () => {
    const surface = await import("../src/index.js");

    expect(Object.keys(surface).some((name) => /preview|предпросмотр/i.test(name))).toBe(false);
  });
});
