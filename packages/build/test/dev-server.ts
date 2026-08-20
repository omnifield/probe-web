// Обвязка проб, которые поднимают НАСТОЯЩИЙ дев-сервер и ходят в него настоящими HTTP-запросами.
// Не проба сама по себе (расширение не `.test.ts`, раннер её не подхватит) — общее место для
// того, что иначе пришлось бы держать в двух файлах одинаковым.
//
// Держать это порознь нельзя ровно по причине из шапки `workspace-source.ts`: у каждой копии
// свой срок годности. Замер про `waitForRequestsIdle()` ниже стоил отдельного разбора, и
// вторая его копия, отставшая на одну правку, вернёт зависание молча.

import { createServer, type ViteDevServer } from "vite";

/**
 * Поднимает дев-сервер приложения его собственным конфигом (то есть пресетом из `/vite`).
 *
 * @param root корень тестового приложения
 * @returns запущенный сервер
 */
export async function startServer(root: string): Promise<ViteDevServer> {
  const server = await createServer({
    root,
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
export async function closeServer(server: ViteDevServer | undefined): Promise<void> {
  await server?.waitForRequestsIdle?.();
  await server?.close();
}

/**
 * Базовый адрес поднятого сервера.
 *
 * @param server запущенный сервер
 * @returns адрес без завершающего слеша
 */
export function baseUrl(server: ViteDevServer): string {
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
export async function fetchModule(server: ViteDevServer, url: string): Promise<string> {
  const response = await fetch(`${baseUrl(server)}${url}`);
  if (!response.ok) throw new Error(`${url} — ${response.status} ${response.statusText}`);
  return await response.text();
}
