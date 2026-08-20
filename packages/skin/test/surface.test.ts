// ПОВЕРХНОСТЬ ПОСТАВКИ — обещание подпутей, проверенное по СОБРАННОМУ файлу, а не по намерению.
//
// Обещаний два, и оба стоят денег потребителю:
//
//   • порождение отдаёт ВЛОЖЕННУЮ форму и postcss в цепочку не тянет — витрина и редактор
//     порождают CSS на каждое движение ручки, и разворачиватель был там главным весом;
//   • `./model` не тянет даже печать — хранилищу и проверке сохранённой записи она не нужна.
//
// Проверить их можно только тем, что уехало в `dist`: исходник об этом не говорит — важно, что
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

describe("postcss живёт ТОЛЬКО за подпутём `./flat`", () => {
  it("в собранном `index.js` нет ни одной ссылки на postcss", () => {
    // Главный пункт задачи: вложенная форма отдаётся БЕЗ postcss в цепочке. Он попадает в сборку
    // потребителя от одного импорта, звали его или нет, — поэтому проверяем собранный файл.
    expect(bundle("index.js")).not.toContain("postcss");
  });

  it("в `model.js` — тем более", () => {
    expect(bundle("model.js")).not.toContain("postcss");
  });

  it("в `flat.js` — есть: там ему и место", () => {
    expect(bundle("flat.js")).toContain("postcss-nested");
  });

  it("`./flat` отдаёт ТОЛЬКО разворот: широкий вход вернул бы postcss всем", async () => {
    const flat = await import("../src/flat.js");

    expect(Object.keys(flat)).toEqual(["flattenCss"]);
  });

  it("покрытие лежит в `./model`: хранилищу оно нужно, а postcss — нет", async () => {
    // «Отказаться сохранить неполный скин» — работа хранилища, и ставить ради неё конвейер CSS
    // ему не за что. Проверяем не намерение, а собранный файл: `model.js` postcss не содержит
    // (проба выше), и вход в покрытие есть.
    const model = await import("../src/model.js");

    expect(typeof model.skinGaps).toBe("function");
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
