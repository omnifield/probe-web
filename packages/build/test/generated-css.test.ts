// Дев-цикл: CSS соседа ПОРОЖДАЕТСЯ в момент запроса, а не читается из его вчерашней сборки
// (`PWEB-21`). Проверяется настоящим дев-сервером и настоящими HTTP-запросами — «в конфиге есть
// плагин» ничего не доказывает, доказывает отданное содержимое.
//
// Сосед — `test/fixture-dep`. Он объявляет подпуть `./generate` (способность порождать) и два
// CSS-подпутя: `./made.css`, у которого функция есть, и `./written.css`, у которого её нет.
// Второй здесь не для симметрии: объявление `./generate` не должно превращать пакет в такой,
// у которого перехвачены ВСЕ стили разом, включая написанные руками.
//
// Перечень, из которого собирается порождённое, лежит у соседа отдельным модулем (`marks.ts`),
// и правит проба именно его: свежесть обязана держаться на ТРАНЗИТИВНОЙ правке, а не только на
// правке того модуля, который дев-сервер грузит напрямую.

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveConfig, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeServer, fetchModule, startServer } from "./dev-server.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "fixture");
const depDir = resolve(here, "fixture-dep");
const depDist = join(depDir, "dist");
const depMarks = join(depDir, "src", "css", "marks.ts");
const depWritten = join(depDist, "css", "written.css");

/** Модуль приложения, тянущий CSS-подпуть, который сосед порождает. */
const MADE_PROBE = "/src/generated-css-probe.ts";

/** Модуль приложения, тянущий CSS-подпуть того же соседа, у которого порождателя нет. */
const WRITTEN_PROBE = "/src/written-css-probe.ts";

/** Убирает сборку соседа целиком — состояние свежего клона, где `build` ещё не запускали. */
function removeDist(): void {
  rmSync(depDist, { recursive: true, force: true });
}

/** Кладёт написанный руками CSS соседа — тот, который перехватывать НЕЛЬЗЯ. */
function writeWritten(): void {
  mkdirSync(dirname(depWritten), { recursive: true });
  writeFileSync(depWritten, ":root {\n  --written-on-disk: 1;\n}\n", "utf8");
}

/**
 * Достаёт из трансформированного модуля адрес, по которому браузер пойдёт за таблицей стилей.
 *
 * @param code ответ дев-сервера
 * @returns адрес импорта
 */
function cssImport(code: string): string {
  const match = code.match(/import ["']([^"']*\.css[^"']*)["']/);
  if (!match) throw new Error(`в ответе нет импорта стилей:\n${code}`);
  return match[1];
}

/**
 * Ждёт, пока дев-сервер начнёт отдавать по адресу ожидаемое.
 *
 * Опрос, а не одиночный запрос: правка файла доходит до сервера событием файловой системы, и
 * между записью и обесцениванием модуля лежит время, которого никто не обещает. Одиночный
 * запрос в этом месте — не проба, а лотерея, красная тем чаще, чем занятее машина.
 *
 * Адрес спрашивается ГОЛЫЙ, без ключа обхода кэша. Ключ доказывал бы только то, что порождение
 * зовётся заново, когда его об этом попросили; доказать надо другое — что устаревшим считает
 * ответ САМ сервер, потому что иначе браузер, который такого ключа не добавляет, продолжит
 * показывать вчерашнее.
 *
 * @param server запущенный сервер
 * @param url адрес модуля
 * @param expected текст, которого ждём в ответе
 * @param timeoutMs предел ожидания
 * @returns последний полученный ответ
 */
async function fetchUntil(
  server: ViteDevServer,
  url: string,
  expected: string,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = performance.now() + timeoutMs;
  let last = "";

  for (;;) {
    last = await fetchModule(server, url);
    if (last.includes(expected)) return last;
    if (performance.now() > deadline) return last;
    await new Promise((done) => setTimeout(done, 100));
  }
}

describe("свежий клон: CSS соседа порождается в момент запроса", () => {
  let server: ViteDevServer;
  let probe = "";
  let made = "";

  beforeAll(async () => {
    // Ни одного собранного файла у соседа — ровно как после `git clone`, где `dist` не в учёте.
    removeDist();
    server = await startServer(fixtureDir);
    probe = await fetchModule(server, MADE_PROBE);
    made = await fetchModule(server, cssImport(probe));
  });

  afterAll(async () => {
    await closeServer(server);
    removeDist();
  });

  it("сборки соседа не существует — проба зеленеет не от файла на диске", () => {
    expect(existsSync(depDist)).toBe(false);
  });

  it("браузер идёт по адресу CSS-подпутя соседа", () => {
    expect(cssImport(probe)).toContain("made.css");
  });

  it("отдано порождённое: блок собран из перечня в коде соседа", () => {
    expect(made).toContain("--fixture-alpha");
    expect(made).toContain("--fixture-beta");
  });

  it("правка перечня в коде соседа видна в отданном CSS без пересборки", async () => {
    const original = readFileSync(depMarks, "utf8");
    try {
      writeFileSync(depMarks, original.replace('"beta"', '"beta", "gamma"'), "utf8");

      const updated = await fetchUntil(server, cssImport(probe), "--fixture-gamma");
      expect(updated).toContain("--fixture-gamma");
      // Сборки соседа не появилось и от этого: свежесть держится порождением, а не тем, что
      // кто-то по дороге собрал пакет.
      expect(existsSync(depDist)).toBe(false);
    } finally {
      writeFileSync(depMarks, original, "utf8");
    }
  });
});

describe("объявив порождение, пакет не отдаёт все свои стили разом", () => {
  let server: ViteDevServer;
  let written = "";

  beforeAll(async () => {
    // У этого подпутя функции-порождателя нет, зато есть файл: он и обязан приехать.
    removeDist();
    writeWritten();
    server = await startServer(fixtureDir);
    written = await fetchModule(server, cssImport(await fetchModule(server, WRITTEN_PROBE)));
  });

  afterAll(async () => {
    await closeServer(server);
    removeDist();
  });

  it("подпуть без функции остаётся файлом с диска", () => {
    expect(written).toContain("--written-on-disk");
  });

  it("и порождённым его никто не подменил", () => {
    expect(written).not.toContain("--fixture-alpha");
  });
});

describe("сборки это не касается", () => {
  it("в дев-режиме зацеп есть", async () => {
    const config = await resolveConfig({ root: fixtureDir, logLevel: "warn" }, "serve");
    const names = config.plugins.map((plugin) => plugin.name);
    expect(names).toContain("probe-web-build:generated-css");
  });

  it("в сборке зацепа нет — собирается ровно то, что уедет потребителю", async () => {
    const config = await resolveConfig({ root: fixtureDir, logLevel: "warn" }, "build");
    const names = config.plugins.map((plugin) => plugin.name);
    expect(names).not.toContain("probe-web-build:generated-css");
  });
});
