/** @vitest-environment node */
// Главный гейт: НАСТОЯЩАЯ сборка приложения конфигом из зоны `build` — точка 2 замороженной
// поверхности (`kb:PROBEWEB-4`).
//
// Почему отдельным процессом, а не вызовом `build()` из API Vite: потребитель собирается
// командой, и собирается ЧИТАЯ конфиг с диска. Вызов из теста прошёл бы мимо этого пути и
// доказывал бы работу функции, а не работу оснастки.
//
// Окружение объявлено докблоком на файл — механика vitest, а не правка пресета: пресет из
// `build/vitest` ставит jsdom всем, а этой проверке документ не нужен вовсе.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, "dist");

/** Сборка небыстрая, и это нормально: она поднимает весь Vite с плагинами. */
const BUILD_TIMEOUT = 180_000;

function asset(extension: string): string {
  const dir = join(DIST, "assets");
  const name = readdirSync(dir).find((file) => file.endsWith(extension));
  if (!name) throw new Error(`в ${dir} нет ассета ${extension}`);
  return readFileSync(join(dir, name), "utf8");
}

beforeAll(() => {
  rmSync(DIST, { recursive: true, force: true });
  // `stdio: "pipe"` — вывод сборки нужен только когда она упала: тогда он приезжает в
  // сообщение об ошибке целиком, и причину не приходится искать повторным запуском.
  execFileSync("pnpm", ["exec", "vite", "build"], { cwd: ROOT, stdio: "pipe" });
}, BUILD_TIMEOUT);

describe("vite build конфигом из зоны `build`", () => {
  it("отдаёт страницу с точкой монтирования и модулем", () => {
    const html = readFileSync(join(DIST, "index.html"), "utf8");

    expect(html).toContain('id="root"');
    expect(html).toMatch(/<script type="module"[^>]+src="\/assets\/[^"]+\.js"/);
    expect(existsSync(join(DIST, "assets"))).toBe(true);
  });

  it("в бандл попал КОД приложения, а не пустой шаблон", () => {
    const js = asset(".js");

    // Текст из `app.tsx` — доказательство, что JSX прошёл трансформацию и доехал до бандла.
    // Снимут solid-плагин в зоне `build` — сборка не дойдёт до этой строки вовсе.
    expect(js).toContain("Не похоже на адрес");
    expect(js).toContain("data-slot");
  });

  it("в бандл попали ОБА слоя стилей — тема пакета и оформление приложения", () => {
    const css = asset(".css");

    // Тема (`style/themes.css`): без неё страница поднимется без единого цвета — браузер
    // молча отбросит неразрешённые `var()`, и заметить это можно только глазом.
    expect(css).toContain("--primary:");
    // Базовый слой (`style/css`): шкала радиусов, производная от токена темы.
    expect(css).toContain("--radius-md:");
    // Оформление потребителя (`src/app.css`) — то, чем одет безголовый кит. Кавычки в
    // селекторе снимает минификатор, поэтому сверяем в той форме, в какой он их оставляет.
    expect(css).toContain("[data-slot=button]");
  });
});

describe("шов рантайма — mount() в собранном артефакте", () => {
  /** Собранная страница со всем, что положил Vite. */
  function page(): string {
    return readFileSync(join(DIST, "index.html"), "utf8");
  }

  /** Собранный бандл — тот самый файл, который браузер и исполнит. */
  function bundle(): string {
    return asset(".js");
  }

  it("до исполнения бандла #root ПУСТ — страницу рисует приложение, а не разметка", () => {
    const dom = new JSDOM(page(), { url: "http://localhost/" });

    expect(dom.window.document.querySelector("#root")?.innerHTML).toBe("");
  });

  it("после исполнения бандла в #root стоит живой кит", () => {
    const dom = new JSDOM(page(), { runScripts: "outside-only", url: "http://localhost/" });
    dom.window.eval(bundle());

    // Проверяется вся четвёрка разом и в СОБРАННОМ виде: рантайм нашёл точку монтирования
    // сам (её никто не передавал), сборка преобразовала JSX зависимости по условию `solid`,
    // примитивы отдали зацепки. Переименуют `#root` в рантайме — здесь будет пусто.
    const root = dom.window.document.querySelector("#root");
    expect(root?.querySelector("form.app__form")).not.toBeNull();
    expect(root?.querySelector('[data-slot="input"]')).not.toBeNull();
    expect(root?.querySelector('[data-slot="button"]')).not.toBeNull();
  });

  it("без #root приложение падает внятно, а не рисует пустую страницу", () => {
    const dom = new JSDOM(page().replace('id="root"', 'id="кто-то-переименовал"'), {
      runScripts: "outside-only",
      url: "http://localhost/",
    });

    // Ровно то поведение, ради которого рантайм бросает, а не возвращает `undefined`:
    // сломанный контракт разметки виден сообщением, а не белым экраном.
    expect(() => dom.window.eval(bundle())).toThrow(/#root/);
  });
});
