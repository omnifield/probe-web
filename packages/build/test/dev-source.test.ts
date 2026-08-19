// Дев-цикл: приложение видит ИСХОДНИКИ соседей по воркспейсу, а не их вчерашнюю сборку
// (`PWEB-1`). Проверяется настоящим дев-сервером и настоящими HTTP-запросами к нему — так же,
// как это делает браузер: «конфиг содержит алиас» ничего не доказывает, доказывает отданный
// файл.
//
// Сосед — `test/fixture-dep`, подпуть `./built`: его цель ведёт в `dist/built.js`, рядом лежит
// `src/built.ts`, и отвечают они РАЗНЫМИ словами. Собранную пару кладёт сама проба: под учётом
// её нет, и на свежем клоне её тоже нет — именно это состояние и надо проверить.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "fixture");
const depDir = resolve(here, "fixture-dep");
const depSource = join(depDir, "src", "built.ts");
const depBuilt = join(depDir, "dist", "built.js");

/** Модуль приложения, который тянет подпуть соседа. */
const PROBE = "/src/dev-source-probe.ts";

/** Кладёт собранную пару соседа — ту, которую дев-сервер отдавать НЕ должен. */
function writeBuilt(): void {
  mkdirSync(dirname(depBuilt), { recursive: true });
  writeFileSync(depBuilt, 'export const origin = "dist";\n', "utf8");
}

/** Убирает собранную пару соседа — состояние свежего клона, где `build` ещё не запускали. */
function removeBuilt(): void {
  rmSync(dirname(depBuilt), { recursive: true, force: true });
}

/**
 * Поднимает дев-сервер приложения его собственным конфигом (то есть пресетом из `/vite`).
 *
 * @returns запущенный сервер
 */
async function startServer(): Promise<ViteDevServer> {
  const server = await createServer({
    root: fixtureDir,
    logLevel: "warn",
    // Порт свободный: прогон не должен зависеть от того, поднято ли рядом приложение.
    server: { port: 0 },
  });
  await server.listen();
  return server;
}

/**
 * Гасит сервер, дав ему сперва доработать начатое.
 *
 * Ответ на запрос НЕ означает, что работа по нему кончилась: за ответом на модуль приложения
 * дев-сервер запускает пребандл зависимостей, и `close()`, вызванный в этот момент, не
 * возвращается ВОВСЕ — висит бесконечно, а не долго (замерено 2026-08-19 на Vite 8.2.1).
 * Штатный способ дождаться — `waitForRequestsIdle()`; после него закрытие занимает единицы
 * миллисекунд, и обрывать соединения проб руками не приходится.
 *
 * @param server запущенный сервер
 */
async function closeServer(server: ViteDevServer | undefined): Promise<void> {
  await server?.waitForRequestsIdle?.();
  await server?.close();
}

/** Базовый адрес поднятого сервера. */
function baseUrl(server: ViteDevServer): string {
  const local = server.resolvedUrls?.local[0];
  if (!local) throw new Error("дев-сервер не назвал локальный адрес");
  return local.replace(/\/$/, "");
}

/**
 * Забирает модуль у дев-сервера так же, как его забрал бы браузер.
 *
 * @param server запущенный сервер
 * @param url путь модуля
 * @returns текст ответа
 */
async function fetchModule(server: ViteDevServer, url: string): Promise<string> {
  const response = await fetch(`${baseUrl(server)}${url}`);
  if (!response.ok) throw new Error(`${url} — ${response.status} ${response.statusText}`);
  return await response.text();
}

/**
 * Достаёт из трансформированного модуля адрес, по которому браузер пойдёт за соседом.
 *
 * @param code ответ дев-сервера
 * @returns адрес импорта соседа
 */
function neighbourImport(code: string): string {
  const match = code.match(/from ["']([^"']*built[^"']*)["']/);
  if (!match) throw new Error(`в ответе нет импорта соседа:\n${code}`);
  return match[1];
}

describe("сосед по воркспейсу отдаётся исходником, а не сборкой", () => {
  let server: ViteDevServer;
  let probe = "";
  let neighbour = "";

  beforeAll(async () => {
    writeBuilt();
    server = await startServer();
    probe = await fetchModule(server, PROBE);
    neighbour = await fetchModule(server, neighbourImport(probe));
  });

  afterAll(async () => {
    await closeServer(server);
    removeBuilt();
  });

  it("собранная пара на диске есть — проба зеленеет не от её отсутствия", () => {
    expect(readFileSync(depBuilt, "utf8")).toContain('"dist"');
  });

  it("браузер идёт в исходник соседа, а не в его dist", () => {
    const url = neighbourImport(probe);
    expect(url).toContain("fixture-dep/src/built.ts");
    expect(url).not.toContain("dist/built.js");
  });

  it("отданный модуль — содержимое исходника", () => {
    // Смотрим на ЗНАЧЕНИЕ, а не на текст файла: слово `dist` встречается и в комментарии
    // исходника, и поиск по нему зеленел бы или краснел не от того, что проверяется.
    expect(neighbour).toMatch(/origin\s*=\s*"src"/);
    expect(neighbour).not.toMatch(/origin\s*=\s*"dist"/);
  });

  it("правка исходника соседа доезжает без пересборки", async () => {
    const original = readFileSync(depSource, "utf8");
    try {
      writeFileSync(depSource, original.replace('"src"', '"src-правка"'), "utf8");
      const url = neighbourImport(probe);
      const updated = await fetchModule(server, `${url}${url.includes("?") ? "&" : "?"}t=1`);
      expect(updated).toContain('"src-правка"');
    } finally {
      writeFileSync(depSource, original, "utf8");
    }
  });
});

describe("свежий клон: дев-сервер поднимается без предварительного build", () => {
  let server: ViteDevServer;
  let probe = "";

  beforeAll(async () => {
    // Ни одного собранного файла у соседа — ровно как после `git clone`, где `dist` не в учёте.
    removeBuilt();
    server = await startServer();
    probe = await fetchModule(server, PROBE);
  });

  afterAll(async () => {
    await closeServer(server);
  });

  it("модуль соседа отдан, хотя его сборки не существует", () => {
    expect(neighbourImport(probe)).toContain("fixture-dep/src/built.ts");
  });
});

describe("дев-сервер соседей не пребандлит и доступен снаружи", () => {
  let server: ViteDevServer;

  beforeAll(async () => {
    removeBuilt();
    server = await startServer();
  });

  afterAll(async () => {
    await closeServer(server);
  });

  it("соседи по воркспейсу исключены из пребандла", () => {
    expect(server.config.optimizeDeps.exclude).toContain("probe-web-build-fixture-jsx-dep");
  });

  it("пакет из реестра не тронут ни исключением, ни алиасом", () => {
    expect(server.config.optimizeDeps.exclude ?? []).not.toContain("solid-js");

    const aliases = server.config.resolve.alias as { find: string | RegExp }[];
    const forSolid = aliases.filter(({ find }) => String(find).includes("solid-js"));
    expect(forSolid).toEqual([]);
  });

  it("папки соседей открыты дев-серверу на чтение", () => {
    const allow = server.config.server.fs.allow.map((path) => path.replace(/\\/g, "/"));
    expect(allow.some((path) => depDir.replace(/\\/g, "/").startsWith(path))).toBe(true);
  });

  it("собственные файлы приложения дев-сервер отдаёт по-прежнему", async () => {
    // Заданный список `fs.allow` ОТМЕНЯЕТ умолчание Vite, и корень приложения надо назвать
    // самим. Без этого дев-сервер отвечает `403` на свой же `/src/main.tsx` — то есть открытие
    // соседей закрывает приложение (замерено на `apps/reference` 2026-08-19).
    const response = await fetch(`${baseUrl(server)}/src/main.tsx`);
    expect(response.status).toBe(200);
  });

  it("сервер слушает не только localhost — до него доходят с хоста", () => {
    expect(server.config.server.host).toBe(true);
    expect(server.resolvedUrls?.network.length ?? 0).toBeGreaterThan(0);
  });

  it("по сетевому адресу отвечает то же приложение", async () => {
    const network = server.resolvedUrls?.network[0];
    if (!network) throw new Error("дев-сервер не назвал сетевой адрес");

    // Спрашиваем страницу приложения, а не модуль соседа: здесь утверждается ДОСТУПНОСТЬ
    // сервера снаружи, и подмешивать сюда исход подмены исходников значит проверять двумя
    // пробами одно и то же, а при поломке гадать, какая из двух вещей отказала.
    const response = await fetch(network);
    expect(response.ok).toBe(true);
    expect(await response.text()).toContain("<div id=\"root\">");
  });
});
