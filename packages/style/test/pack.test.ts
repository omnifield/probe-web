import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Гейт ПОСТАВКИ: что окажется в тарболе и разрешится ли из него подпуть. Проверять это по
// полям манифеста бессмысленно — `files` и `exports` расходятся с фактом молча, и узнаёт
// об этом потребитель, а не мы.

const pkgRoot = resolve(import.meta.dirname, "..");
const PKG = "@omnifield/probe-web-style";

let work: string;
let entries: string[];
let install: string;

beforeAll(() => {
  work = mkdtempSync(join(tmpdir(), "probe-web-style-pack-"));

  const packed = execFileSync("pnpm", ["pack", "--pack-destination", work], {
    cwd: pkgRoot,
    encoding: "utf8",
  });
  const tarball = packed.trim().split("\n").at(-1) as string;

  entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .trim()
    .split("\n")
    // npm-тарбол кладёт всё под `package/` — сравниваем пути такими, какими их увидит
    // потребитель после установки.
    .map((entry) => entry.replace(/^package\//, ""));

  // «Чистая установка» без dev-обвеса: распакованный тарбол лежит там, где его ищет
  // резолвер Node, и подпуть проверяется по `exports`, а не по угаданному пути в dist.
  install = join(work, "consumer");
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", work]);
  execFileSync("mv", [join(work, "package"), join(install, "node_modules", PKG)]);
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

  it("подпуть `/css` резолвится в базовый CSS", () => {
    expect(req().resolve(`${PKG}/css`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "base.css"),
    );
  });

  it("подпуть `/themes.css` резолвится в дефолтную пару тем", () => {
    expect(req().resolve(`${PKG}/themes.css`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "themes.css"),
    );
  });

  it("внутренние файлы наружу не торчат — только объявленные подпути", () => {
    expect(() => req().resolve(`${PKG}/dist/tokens.js`)).toThrow();
  });

  it("установка состоит только из поставки", () => {
    expect(readdirSync(join(install, "node_modules", PKG)).sort()).toEqual([
      "README.md",
      "dist",
      "package.json",
    ]);
  });
});
