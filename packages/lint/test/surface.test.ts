// Поверхность пакета — ПЕРЕЧНЕМ, а не на глаз. Проверяются два разных утверждения:
//   1. манифест объявляет одну точку наружу и правильные зависимости — лишний экспорт
//      и не та зависимость замерзают у потребителя вместе с выпуском;
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
};

/** Все пути, на которые указывает `exports`, — включая ветки условий (`types`/`default`). */
const exportTargets = (exports: Exports): string[] =>
  Object.values(exports).flatMap((entry) =>
    typeof entry === "string" ? [entry] : Object.values(entry),
  );

/** Содержимое тарбола, пути — уже без служебного префикса `package/`. */
let packed: string[] = [];
let workDir = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "probe-web-lint-pack-"));

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
  it("назван по эко-канону @omnifield/<продукт>-<пакет>", () => {
    expect(manifest.name).toBe("@omnifield/probe-web-lint");
  });

  it("объявляет ровно одну точку наружу", () => {
    // Пресет — один артефакт. Подпути появятся, только если появится второй адресат;
    // объявленный «на будущее» экспорт замерзает у потребителя ничем не занятый.
    expect(Object.keys(manifest.exports)).toEqual(["."]);
  });

  it("ESM-only и без побочных эффектов — норма публикации фонда", () => {
    expect(manifest.type).toBe("module");
    expect(manifest.sideEffects).toBe(false);
  });

  it("ESLint объявлен peer, а не обычной зависимостью", () => {
    // Команду `eslint` запускает потребитель, и движок обязан быть один: две копии дадут
    // «плагин не найден» на ровном месте.
    expect(Object.keys(manifest.peerDependencies)).toEqual(["eslint"]);
    expect(manifest.dependencies["eslint"]).toBeUndefined();
  });

  it("плагин и парсер едут с пакетом — потребитель про них не знает", () => {
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

  it("несёт сборку и типы", () => {
    expect(packed).toEqual(
      expect.arrayContaining(["dist/index.js", "dist/index.d.ts", "dist/rules.js", "README.md"]),
    );
  });

  it("не тащит потребителю исходники, тесты и фикстуры", () => {
    expect(packed.filter((entry) => entry.startsWith("src/"))).toEqual([]);
    expect(packed.filter((entry) => entry.startsWith("test/"))).toEqual([]);
  });
});
