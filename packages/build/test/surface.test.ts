// Поверхность пакета — ПЕРЕЧНЕМ, а не на глаз (Acceptance задачи `PROBEWEB-9`).
//
// Проверяем три разных утверждения:
//   1. манифест объявляет ровно три подпути наружу — лишний экспорт замерзает навсегда;
//   2. каждая объявленная цель реально лежит в тарболе — иначе `exports` указывает в пустоту
//      и пакет ломается у потребителя, а не у нас;
//   3. в тарбол не уехали исходники, тесты и тестовое приложение.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

type Exports = Record<string, string | Record<string, string>>;

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  name: string;
  exports: Exports;
};

/** Все пути, на которые указывает `exports`, — включая ветки условий (`types`/`default`). */
function exportTargets(exports: Exports): string[] {
  return Object.values(exports).flatMap((entry) =>
    typeof entry === "string" ? [entry] : Object.values(entry),
  );
}

/** Содержимое тарбола, пути — уже без служебного префикса `package/`. */
let packed: string[] = [];
let workDir = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "probe-web-build-pack-"));

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
  it("объявляет ровно три подпути наружу", () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(["./tsconfig", "./vite", "./vitest"]);
  });

  it("назван по эко-канону @omnifield/<продукт>-<пакет>", () => {
    expect(manifest.name).toBe("@omnifield/probe-web-build");
  });
});

describe("тарбол pnpm pack", () => {
  it("содержит каждую цель из exports", () => {
    const missing = exportTargets(manifest.exports)
      .map((target) => target.replace(/^\.\//, ""))
      .filter((target) => !packed.includes(target));

    expect(missing).toEqual([]);
  });

  it("несёт сборку, пресет тестов и базу типов отдельными файлами", () => {
    expect(packed).toEqual(
      expect.arrayContaining([
        "dist/vite.js",
        "dist/vite.d.ts",
        "dist/vitest.js",
        "dist/vitest.d.ts",
        "tsconfig.base.json",
      ]),
    );
  });

  it("не тащит потребителю исходники, тесты и тестовое приложение", () => {
    expect(packed.filter((entry) => entry.startsWith("src/"))).toEqual([]);
    expect(packed.filter((entry) => entry.startsWith("test/"))).toEqual([]);
  });
});
