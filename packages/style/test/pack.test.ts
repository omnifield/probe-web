import { createRequire } from "node:module";
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball, pkgRoot } from "./helpers/install.js";

// Гейт ПОСТАВКИ: что окажется в тарболе и разрешится ли из него подпуть. Проверять это по
// полям манифеста бессмысленно — `files` и `exports` расходятся с фактом молча, и узнаёт
// об этом потребитель, а не мы. Ответ на вопрос «а ТИПИЗИРУЕТСЯ ли подпуть у потребителя»
// этот гейт не даёт — он в `types.test.ts`.

let work: string;
let entries: string[];
let install: string;

beforeAll(() => {
  ({ work, install, entries } = installFromTarball("probe-web-style-pack-"));
  writeFileSync(join(install, "index.cjs"), "", "utf8");
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("pnpm pack", () => {
  it("везёт сборку — JS, типы и оба CSS-артефакта", () => {
    expect(entries).toEqual(
      expect.arrayContaining([
        "dist/index.js",
        "dist/index.d.ts",
        "dist/css/base.css",
        "dist/css/themes.css",
        "package.json",
        "README.md",
      ]),
    );
  });

  it("исходников и тестов в тарболе нет", () => {
    const leaked = entries.filter(
      (entry) =>
        entry.startsWith("src/") ||
        entry.startsWith("test/") ||
        entry.startsWith("scripts/") ||
        entry.startsWith("tsconfig"),
    );
    expect(leaked).toEqual([]);
  });
});

describe("разрешение из установки", () => {
  const req = () => createRequire(join(install, "index.cjs"));

  it("корень отдаёт собранный модуль", () => {
    expect(req().resolve(PKG)).toBe(
      join(install, "node_modules", PKG, "dist", "index.js"),
    );
  });

  it("подпуть `/base.css` резолвится в базовый CSS", () => {
    expect(req().resolve(`${PKG}/base.css`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "base.css"),
    );
  });

  it("старого подпутя `/css` нет — алиаса не осталось", () => {
    // Два имени одного файла = второй источник правды: через месяц не сказать, какое
    // каноническое, и в скелетах разъедутся оба.
    expect(() => req().resolve(`${PKG}/css`)).toThrow();
  });

  it("подпуть `/themes.css` резолвится в дефолтную пару тем", () => {
    expect(req().resolve(`${PKG}/themes.css`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "themes.css"),
    );
  });

  it("внутренние файлы наружу не торчат — только объявленные подпути", () => {
    expect(() => req().resolve(`${PKG}/dist/tokens.js`)).toThrow();
  });

  it("установка значений не привозит зависимостей инструментов", () => {
    // Разрез считается сделанным не тогда, когда `cn` исчез с поверхности, а когда его
    // зависимости перестали приезжать вместе со значениями. Пока `clsx`, `tailwind-merge`
    // и `cva` стоят в манифесте, «инструменты необязательны» неправда: их ставит каждый,
    // кто взял значения (`PWEB-3`).
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ];

    for (const tool of ["clsx", "tailwind-merge", "class-variance-authority"]) {
      expect(declared, `${tool} — зависимость инструментов, а не значений`).not.toContain(tool);
    }
  });

  it("установка состоит только из поставки", () => {
    expect(readdirSync(join(install, "node_modules", PKG)).sort()).toEqual([
      "README.md",
      "dist",
      "package.json",
    ]);
  });
});
