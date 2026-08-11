/** @vitest-environment node */
// Дев-сервер: последняя из четырёх точек, которую нельзя подтвердить ни сборкой, ни JSDOM.
// Собранный бандл и дев-режим — РАЗНЫЕ пути одного плагина: в деве Vite отдаёт модули по
// одному и трансформирует их на лету. Сломается именно этот путь — `vite build` останется
// зелёным, а `pnpm dev` покажет белый экран, и заметить это будет некому.
//
// Сервер поднимается ОТДЕЛЬНЫМ ПРОЦЕССОМ, как его поднимает человек. Причина не только в
// честности пути: `createServer()` из API внутри vitest не закрывается после запроса —
// `close()` ждёт сокета, который держит `fetch` node'ы, и прогон встаёт на закрытии
// (замерено 2026-08-08: 180 с до таймаута хука против 11 мс в голом node). Процесс такой
// зависимости не имеет — он просто убивается.

import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Дев-сервер стартует быстро, но первый холодный прогон тянет предбандл зависимостей. */
const START_TIMEOUT = 120_000;

let server: ChildProcessWithoutNullStreams | undefined;
let origin = "";

/**
 * Ждёт в выводе адрес, который дев-сервер печатает человеку, и отдаёт его.
 *
 * Адрес берётся из вывода, а не задаётся заранее: порт выбирает сам Vite (`--port 0`), и
 * прибитый номер сделал бы прогон зависимым от того, что этот порт свободен.
 */
function waitForAddress(child: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve, reject) => {
    let out = "";

    const onData = (chunk: Buffer): void => {
      out += chunk.toString();
      const found = /http:\/\/127\.0\.0\.1:(\d+)/.exec(out);
      if (found) resolve(`http://127.0.0.1:${found[1]}`);
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      reject(new Error(`дев-сервер завершился с кодом ${code}, не назвав адреса:\n${out}`));
    });
  });
}

/**
 * Запрос к дев-серверу БЕЗ keep-alive.
 *
 * `Connection: close` не украшение: открытый сокет пережил бы тест и держал бы прогон.
 */
function ask(path: string): Promise<Response> {
  return fetch(`${origin}${path}`, { headers: { connection: "close" } });
}

beforeAll(async () => {
  // Адрес прибит к IPv4 намеренно: по имени `localhost` клиент и сервер расходятся по
  // семействам адресов (сервер слушает `::1`, node стучится в `127.0.0.1`) — отказ соединения
  // на ровном месте, проверено 2026-08-08.
  server = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", "0"], { cwd: ROOT });
  origin = await waitForAddress(server);
}, START_TIMEOUT);

afterAll(() => {
  server?.kill("SIGTERM");
});

describe("дев-сервер отдаёт живое приложение", () => {
  it("страница несёт точку монтирования и модуль входа", async () => {
    const response = await ask("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('id="root"');
    expect(html).toContain("/src/main.tsx");
  });

  it("вход приезжает УЖЕ преобразованным — JSX в браузер не уезжает", async () => {
    const response = await ask("/src/main.tsx");
    const code = await response.text();

    expect(response.status).toBe(200);
    // Трансформ сделал solid-плагин из зоны `build`: `<App />` стал вызовом `createComponent`.
    // Сверяем по имени вызова, а не по строке `solid-js/web`: в деве Vite подменяет
    // спецификатор на путь предбандленной зависимости, и проверка «есть такой импорт» ловила
    // бы способ оптимизации, а не трансформацию.
    expect(code).toContain("createComponent");
    expect(code).not.toContain("<App />");
  });

  it("примитив кита приезжает исходным JSX и трансформируется на месте", async () => {
    const response = await ask("/src/app.tsx");
    const code = await response.text();

    expect(response.status).toBe(200);
    // Зацепка `data-slot` — из зоны `ui`; вокруг неё в деве уже стоят вызовы Solid.
    expect(code).toContain("createComponent");
    expect(code).not.toContain("<Field");
  });
});
