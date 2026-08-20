// Гейт ПОСТАВКИ: что уезжает наружу и чем отличаются ветки `exports`.
//
// По полям манифеста это не проверяется — `files`, `exports` и факт расходятся молча, и узнаёт
// об этом потребитель. Проверяется собранное: пробы зоны запускаются после `build` (скрипт
// `test` манифеста), поэтому `dist` здесь всегда свежий.
//
// Главный предмет — обещание подпути `./model`: читателю правил не должно приезжать ни Solid,
// ни отрисовки. Обещание, не проверенное машиной, живёт до первого случайного импорта.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(join(pkgRoot, "dist", file), "utf8");

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  exports: Record<string, Record<string, string>>;
  files: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

describe("манифест", () => {
  it("два подпути: механика целиком и модель без отрисовки", () => {
    expect(Object.keys(manifest.exports)).toEqual([".", "./model"]);
  });

  it("ветка `solid` объявлена ДО `default` — иначе условие не выберется", () => {
    expect(Object.keys(manifest.exports["."] as Record<string, string>)).toEqual([
      "solid",
      "types",
      "default",
    ]);
  });

  it("зависимостей в поставке нет: Solid приносит потребитель", () => {
    expect(manifest.dependencies).toBeUndefined();
    expect(Object.keys(manifest.peerDependencies ?? {})).toEqual(["solid-js"]);
  });
});

describe("собранное", () => {
  it("ветка `solid` несёт НЕпреобразованный JSX, а `default` — разобранный", () => {
    const jsx = read("index.jsx");
    const plain = read("index.js");

    // Разметка узлами компонентов — признак НЕразобранного JSX: `<For each={…}>` доживает до
    // файла только в ветке `solid`. Обратный признак — `template(…)` из `solid-js/web`, в
    // который babel-preset-solid превращает разметку; в непреобразованной ветке его нет.
    expect(jsx).toContain("<For each=");
    expect(plain).not.toContain("<For each=");
    expect(plain).toContain("solid-js/web");
    expect(plain).toContain("template(");
  });

  it("подпуть `./model` не тянет Solid вовсе — ни импортом, ни JSX", () => {
    const model = read("model.js");

    expect(model).not.toContain("solid-js");
    expect(model).not.toContain("<span");
  });

  it("подпуть `./model` отдаёт модель, правила и правки", () => {
    const model = read("model.js");

    for (const name of [
      "createRegistry",
      "readAddress",
      "canContain",
      "canAdmit",
      "allowedInside",
      "checkTree",
      "possibleOwnersOf",
      "ownersAdmitting",
      "coordinateOf",
      "nodesSharingCoordinate",
      "sketchOf",
      "insertNode",
      "removeNode",
      "moveNode",
      "updateNode",
    ]) {
      expect(model).toContain(name);
    }
  });

  it("корневой вход отдаёт и отрисовку", () => {
    expect(read("index.js")).toContain("RenderTree");
  });

  it("на каждый вход есть декларации", () => {
    expect(read("index.d.ts")).toContain("RenderTree");
    expect(read("model.d.ts")).toContain("createRegistry");
  });
});
