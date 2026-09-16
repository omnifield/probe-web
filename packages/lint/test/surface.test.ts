// Поверхность пакета — ПЕРЕЧНЕМ, а не на глаз. Проверяются два разных утверждения:
//   1. манифест объявляет правильные точки входа и правильные зависимости — лишний
//      экспорт и не та зависимость замерзают у потребителя вместе с выпуском;
//   2. каждая объявленная цель реально лежит в тарболе, а исходники и тесты — нет.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

type Exports = Record<string, string | Record<string, string>>;

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  name: string;
  type: string;
  sideEffects: boolean;
  exports: Exports;
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  peerDependenciesMeta: Record<string, { optional?: boolean }>;
};

/**
 * Пути, которые обязаны реально лежать в тарболе: ветки `types`/`default` условного
 * экспорта — то, что видит потребитель из `node_modules`. `development` НЕ сюда: она ведёт в
 * `src/*.ts` намеренно (быстрый путь монорепы мимо сборки) и намеренно не едет в публикацию —
 * см. ниже «не тащит потребителю исходники».
 */
const SHIPPED_CONDITIONS = new Set(["types", "default"]);

const exportTargets = (exports: Exports): string[] =>
  Object.values(exports).flatMap((entry) =>
    typeof entry === "string"
      ? [entry]
      : Object.entries(entry)
          .filter(([condition]) => SHIPPED_CONDITIONS.has(condition))
          .map(([, target]) => target),
  );

/** Содержимое тарбола, пути — уже без служебного префикса `package/`. */
let packed: string[] = [];
let workDir = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "web-core-lint-pack-"));

  execFileSync("pnpm", ["pack", "--pack-destination", workDir], {
    cwd: pkgRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const tarball = readdirSync(workDir).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("pnpm pack не оставил тарбол");

  packed = execFileSync("tar", ["-tzf", join(workDir, tarball)], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//, ""));
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("манифест", () => {
  it("назван по эко-канону @web-core/<пакет>", () => {
    expect(manifest.name).toBe("@web-core/lint");
  });

  it("объявляет пять точек наружу — два канона, два движка, готовый biome.json", () => {
    // Пакет держит два независимых канона (Solid-реактивность, кодстиль/импорты) — отсюда
    // подпутей больше одного, но не «на будущее»: у каждого есть живой адресат сегодня.
    expect(Object.keys(manifest.exports)).toEqual([
      ".",
      "./eslint",
      "./style",
      "./biome",
      "./biome.json",
    ]);
  });

  it("ESM-only и без побочных эффектов — норма публикации кита", () => {
    expect(manifest.type).toBe("module");
    expect(manifest.sideEffects).toBe(false);
  });

  it("оба движка объявлены peer и опциональны — нужен только тот, что реально подключён", () => {
    // Команду запускает потребитель, и движок обязан быть один: две копии дадут «плагин не
    // найден» на ровном месте.
    expect(Object.keys(manifest.peerDependencies).sort()).toEqual(["@biomejs/biome", "eslint"]);
    expect(manifest.dependencies["eslint"]).toBeUndefined();
    expect(manifest.dependencies["@biomejs/biome"]).toBeUndefined();
    expect(manifest.peerDependenciesMeta["eslint"]?.optional).toBe(true);
    expect(manifest.peerDependenciesMeta["@biomejs/biome"]?.optional).toBe(true);
  });

  it("плагин и парсер Solid едут с пакетом — потребитель про них не знает", () => {
    expect(Object.keys(manifest.dependencies).sort()).toEqual([
      "@babel/core",
      "@babel/eslint-parser",
      "eslint-plugin-solid",
    ]);
  });

  it("на компилятор TypeScript пакет не завязан ничем", () => {
    // Разбор синтаксиса делает Babel; зависимость на `typescript` вернула бы пресету ту
    // самую поломку по версии компилятора, ради ухода от которой выбран этот парсер.
    expect(manifest.dependencies["typescript"]).toBeUndefined();
    expect(manifest.peerDependencies["typescript"]).toBeUndefined();
  });
});

describe("тарбол pnpm pack", () => {
  it("содержит каждую цель из exports", () => {
    const missing = exportTargets(manifest.exports)
      .map((target) => target.replace(/^\.\//, ""))
      .filter((target) => !packed.includes(target));

    expect(missing).toEqual([]);
  });

  it("несёт обе сборки, типы и генератор biome.json", () => {
    expect(packed).toEqual(
      expect.arrayContaining([
        "dist/index.js",
        "dist/index.d.ts",
        "dist/eslint/index.js",
        "dist/style/index.js",
        "dist/biome/index.js",
        "dist/biome/biome.json",
        "scripts/generate-biome-json.mjs",
        "README.md",
      ]),
    );
  });

  it("не тащит потребителю исходники, тесты и фикстуры", () => {
    expect(packed.filter((entry) => entry.startsWith("src/"))).toEqual([]);
    expect(packed.filter((entry) => entry.startsWith("test/"))).toEqual([]);
  });
});
