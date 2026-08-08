// Главный тест зоны: СОБИРАЕТ настоящее приложение конфигом из `/vite` и проверяет, что в
// разметке появился отрендеренный узел. «Конфиг вернулся объектом» и «страница собралась» —
// разные утверждения, и подтверждать надо второе (DoD задачи `tasker:PROBEWEB-9`).
//
// Приложение подключает пакет как установленный (`workspace:*`), поэтому проверяется не файл
// на диске, а разрешение по `exports` — то, как пакет увидит потребитель.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { build } from "vite";
import { beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "fixture");
const outDir = join(fixtureDir, "dist");

/** Разметка и бандл, собранные Vite из тестового приложения. */
let html = "";
let bundle = "";

beforeAll(async () => {
  rmSync(outDir, { recursive: true, force: true });

  // Конфиг сборки Vite не передаём: его отдаёт сам fixture из точки `/vite`.
  await build({ root: fixtureDir, logLevel: "warn" });

  html = readFileSync(join(outDir, "index.html"), "utf8");

  const script = html.match(/<script[^>]+src="([^"]+)"/);
  if (!script) throw new Error("в собранном index.html нет <script src>");
  bundle = readFileSync(join(outDir, script[1].replace(/^\//, "")), "utf8");
});

describe("сборка приложения конфигом /vite", () => {
  it("кладёт в dist разметку и бандл", () => {
    expect(existsSync(join(outDir, "index.html"))).toBe(true);
    expect(bundle.length).toBeGreaterThan(0);
  });

  it("до исполнения бандла #root пуст — узел рисует именно приложение", () => {
    const dom = new JSDOM(html, { url: "http://localhost/" });
    expect(dom.window.document.querySelector("#root")?.innerHTML).toBe("");
  });

  it("после исполнения бандла в #root появляется отрендеренный узел", () => {
    const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
    dom.window.eval(bundle);

    const node = dom.window.document.querySelector<HTMLElement>(
      '#root h1[data-testid="greeting"]',
    );
    expect(node).not.toBeNull();
    expect(node?.textContent).toContain("hello,");
  });

  it("собирает и JSX, приехавший из зависимости непреобразованным", () => {
    const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
    dom.window.eval(bundle);

    const node = dom.window.document.querySelector<HTMLElement>(
      '#root em[data-testid="dep-greeting"]',
    );
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe("probe-web");
  });
});

describe("точка /tsconfig", () => {
  it("тестовое приложение проходит проверку типов на базе от build", () => {
    const tsc = resolve(fixtureDir, "node_modules/.bin/tsc");
    expect(existsSync(tsc)).toBe(true);

    // Падение tsc бросит из execFileSync — сообщение компилятора попадёт в отчёт теста.
    const out = execFileSync(tsc, ["-p", "tsconfig.json"], {
      cwd: fixtureDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(out).toBe("");
  });
});
