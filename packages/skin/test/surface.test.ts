// ПОВЕРХНОСТЬ ПОСТАВКИ — обещание подпутей, проверенное по СОБРАННОМУ файлу, а не по намерению.
//
// Обещание одно и стоит денег потребителю: `./model` не тянет порождение, а значит не тянет
// postcss. Проверить его можно только тем, что уехало в `dist`: исходник об этом не говорит —
// важно, что попало в бандл после разрешения импортов.
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

describe("подпуть `./model` не тянет порождение", () => {
  it("в собранном `model.js` нет ни одной ссылки на postcss", () => {
    expect(bundle("model.js")).not.toContain("postcss");
  });

  it("корневой вход, наоборот, зовёт разворачиватель — иначе порождать было бы нечем", () => {
    expect(bundle("index.js")).toContain("postcss-nested");
  });
});

describe("что уезжает, а что остаётся", () => {
  it("оба подпути объявлены и указывают на собранные файлы", () => {
    expect(Object.keys(manifest.exports)).toEqual([".", "./model"]);
    expect(() => bundle("index.js")).not.toThrow();
    expect(() => bundle("model.js")).not.toThrow();
    expect(() => bundle("index.d.ts")).not.toThrow();
    expect(() => bundle("model.d.ts")).not.toThrow();
  });

  it("в поставке ровно разворачиватель вложенного и его основание — больше ничего", () => {
    // Замер 2026-08-20: `@pandacss/core` вокруг той же утилиты — 9,0 МБ и 33 пакета против
    // 1,1 МБ и 8. Перечень сравнивается целиком, а не «содержит»: молча подросший список
    // зависимостей — это и есть то, чего проба обязана не пропустить.
    expect(Object.keys(manifest.dependencies).toSorted()).toEqual(["postcss", "postcss-nested"]);
  });

  it("кит объявлен ОДНОРАНГОВЫМ: копию паспортов приносит потребитель", () => {
    // Две копии формы паспорта в дереве разъедутся молча — та самая третья копия, от которой
    // ушли, объявив читателя под вид рядом с формой (`PWEB-27`).
    expect(Object.keys(manifest.peerDependencies)).toEqual(["@omnifield/probe-web-ui"]);
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
