import { createRequire } from "node:module";
import { readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball } from "./helpers/install.js";

// Гейт ПОСТАВКИ: что окажется в тарболе и разрешится ли из него вход. Проверять это по
// полям манифеста бессмысленно — `files` и `exports` расходятся с фактом молча, и узнаёт
// об этом потребитель, а не мы. Ответ на вопрос «а ТИПИЗИРУЕТСЯ ли вход у потребителя»
// этот гейт не даёт — он в `types.test.ts`.

let work: string;
let entries: string[];
let install: string;

beforeAll(() => {
  ({ work, install, entries } = installFromTarball("probe-web-style-tools-pack-"));
  writeFileSync(join(install, "index.cjs"), "", "utf8");
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("pnpm pack", () => {
  it("везёт сборку — JS и типы", () => {
    expect(entries).toEqual(
      expect.arrayContaining(["dist/index.js", "dist/index.d.ts", "package.json", "README.md"]),
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

  it("CSS в поставке нет ни одного файла — инструменты не везут оформления", () => {
    // Инструмент работает с ИМЕНАМИ классов; значение — предмет другой поставки. Появившийся
    // здесь CSS означал бы, что инструменты снова начали привозить вид (`PWEB-3`).
    expect(entries.filter((entry) => entry.endsWith(".css"))).toEqual([]);
  });
});

describe("разрешение из установки", () => {
  const req = () => createRequire(join(install, "index.cjs"));

  it("корень отдаёт собранный модуль", () => {
    expect(req().resolve(PKG)).toBe(join(install, "node_modules", PKG, "dist", "index.js"));
  });

  it("внутренние файлы наружу не торчат — только объявленный вход", () => {
    expect(() => req().resolve(`${PKG}/dist/cn.js`)).toThrow();
  });

  it("установка состоит только из поставки", () => {
    expect(readdirSync(join(install, "node_modules", PKG)).sort()).toEqual([
      "README.md",
      "dist",
      "package.json",
    ]);
  });
});
