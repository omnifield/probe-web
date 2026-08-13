// Точка входа: открыть хранилище, поднять сервер, вежливо лечь по сигналу.
//
// Настройка — окружением, потому что настраивает её тот, кто РАЗВОРАЧИВАЕТ, а не тот, кто
// пишет: каталог данных в контейнере это том, и он не может быть зашит в код.

import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { createHandler } from "./http.js";
import { LIMITS } from "./limits.js";
import { openStore } from "./store.js";

/** Порт по умолчанию. НЕ 5173: там уже слушает дев-сервер стенда зоны `tables`. */
export const DEFAULT_PORT = 8787;

/** Каталог по умолчанию. В контейнере переопределяется на том (`/data`). */
export const DEFAULT_DIR = "./data";

/**
 * Поднять службу. Возвращает адрес и то, чем её положить, — без этого пробам пришлось бы
 * убивать процесс.
 *
 * @param {object} [options]
 * @param {string} [options.dir] каталог с записями
 * @param {number} [options.port] порт; `0` — любой свободный (так делают пробы)
 * @param {string} [options.host]
 * @param {Readonly<import("./limits.js").Limits>} [options.limits]
 * @param {{guard?: any, ask?: any, apiKey?: string | undefined}} [options.agent] подмена канала для проб:
 *   пробы не ходят в сеть и не тратят токены — транспорт подменяется целиком
 */
export async function start(options = {}) {
  const dir = options.dir ?? process.env["PRESETS_DIR"] ?? DEFAULT_DIR;
  const port = options.port ?? Number(process.env["PRESETS_PORT"] ?? DEFAULT_PORT);
  const host = options.host ?? process.env["PRESETS_HOST"] ?? "0.0.0.0";
  const limits = options.limits ?? LIMITS;

  const store = await openStore(dir, limits);
  const server = createServer(createHandler(store, limits, options.agent));

  await new Promise((resolve) => server.listen(port, host, () => resolve(undefined)));

  const address = server.address();
  const bound = typeof address === "object" && address !== null ? address.port : port;

  return {
    server,
    store,
    port: bound,
    origin: `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${bound}`,
    /** @returns {Promise<void>} */
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        // Держащиеся соединения не должны превращать остановку в зависание: данные уже на
        // диске (запись сбрасывается `fsync`), терять при обрыве нечего.
        server.closeAllConnections();
      });
    },
  };
}

/** Запущены напрямую (а не подключены пробой) — значит поднимаемся и слушаем сигналы. */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const running = await start();
  console.log(
    `[probe-web-presets] слушаю ${running.port}, каталог ${running.store.dir}, записей ${running.store.size}`,
  );

  for (const signal of /** @type {const} */ (["SIGTERM", "SIGINT"])) {
    process.on(signal, () => {
      console.log(`[probe-web-presets] ${signal} — останавливаюсь`);
      running.close().then(
        () => process.exit(0),
        () => process.exit(1),
      );
    });
  }
}
