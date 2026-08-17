// Переключалка дев-серверов: один порт наружу, зоны внутри.
//
// Зачем не список ссылок. Дев-серверы живут на разных портах, и каждый порт пришлось бы
// пробрасывать из контейнера отдельно — ровно та возня, ради ухода от которой это и написано.
// Здесь наружу торчит ОДИН порт, а переключение происходит внутри.
//
// Зачем прокси, а не iframe на localhost:5173. Vite отдаёт абсолютные пути (`/@vite/client`,
// `/src/...`, `/node_modules/...`) и держит горячую перезагрузку по вебсокету на том же адресе.
// Отдай мы iframe чужой порт напрямую — снаружи он недоступен; отдай через префикс `/z/tables/`
// — абсолютные пути уедут мимо. Поэтому проксируется ВСЁ, кроме собственных страниц пульта,
// и уходит на ту зону, что выбрана сейчас.
//
// Ноль зависимостей: голый Node. Это оснастка локации, а не поставка, но тянуть ради неё
// пакеты незачем — здесь нужен один прокси и одна страница.

import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env["NAV_PORT"] ?? 4100);
const HOST = process.env["NAV_HOST"] ?? "0.0.0.0";

/**
 * Где искать дев-серверы.
 *
 * Список кандидатов, а не жёсткая раскладка: зоны заводятся и закрываются, порт у новой
 * появляется раньше, чем кто-то вспомнит про этот файл. Пульт показывает то, что реально
 * отвечает, и молчит про остальное.
 */
const CANDIDATES = [
  { id: "tables", label: "Таблицы и фильтры", port: 5173 },
  { id: "skin", label: "Оформления", port: 5174 },
  { id: "map", label: "Карта", port: 5175 },
  { id: "chat", label: "Чат", port: 5176 },
  { id: "studio", label: "Витрина", port: 5177 },
  { id: "reference", label: "Эталонное приложение", port: 5180 },
  { id: "presets", label: "Служба пресетов (API)", port: 8787 },
];

/** Какая зона показывается сейчас. */
let current = CANDIDATES[0].id;

/** Корень репозитория: отсюда берётся собранная панель. */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Перечень пресетов оформления — ИЗ СЛУЖБЫ, и только из неё.
 *
 * Файлы пресетов, лежащие в зоне `skin`, панель НЕ показывает: это её встроенные заготовки,
 * а не то, что кто-то сохранил и чем собирается пользоваться. Решение user 2026-08-17:
 * нет сохранённых пресетов — нет и выбора, панель живёт на базовом оформлении.
 *
 * Служба различает виды ярлыком (`kb:PROBEWEB-8`), наш — `skin`. Пока `skin` не научится туда
 * сохранять (`tasker:PROBEWEB-55`), список пуст — и это правильное состояние, а не сбой.
 */
function presets() {
  return new Promise((resolve) => {
    const call = httpRequest(
      { host: "127.0.0.1", port: 8787, path: "/api/presets?kind=skin", method: "GET" },
      (answer) => {
        let body = "";
        answer.on("data", (chunk) => (body += chunk));
        answer.on("end", () => {
          try {
            const said = JSON.parse(body);
            resolve(Array.isArray(said.items) ? said.items : []);
          } catch {
            resolve([]);
          }
        });
      },
    );
    // Службы нет — список пуст. Панель от этого не ломается: оформление необязательно.
    call.on("error", () => resolve([]));
    call.setTimeout(1500, () => {
      call.destroy();
      resolve([]);
    });
    call.end();
  });
}



/** @param {number} port */
function alive(port) {
  return new Promise((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(300);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function survey() {
  const seen = await Promise.all(
    CANDIDATES.map(async (zone) => ({ ...zone, up: await alive(zone.port) })),
  );
  return seen;
}

/** @param {string} id */
function portOf(id) {
  return CANDIDATES.find((zone) => zone.id === id)?.port ?? CANDIDATES[0].port;
}

/**
 * Отдать файл собранной панели.
 *
 * Панель собирается (`pnpm --dir tools/dev-nav/app build`) и лежит рядом. Не собрана — сервер
 * говорит об этом прямо: молчаливый 404 на своей же странице выглядел бы как поломка прокси.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {string} file
 * @param {string} type
 */
function sendBuilt(res, file, type) {
  if (!/^[a-zA-Z0-9._/-]+$/.test(file) || file.includes("..")) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("недопустимое имя файла");
    return;
  }
  try {
    const body = readFileSync(`${ROOT}tools/dev-nav/app/dist/${file}`);
    res.writeHead(200, { "content-type": type, "cache-control": "no-cache" });
    res.end(body);
  } catch {
    res.writeHead(503, { "content-type": "text/html; charset=utf-8" });
    res.end(
      `<body style="font:14px system-ui;padding:24px">
       <p>Панель не собрана.</p>
       <p><code>pnpm --dir tools/dev-nav/app build</code></p></body>`,
    );
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://nav.local");

  if (url.pathname === "/__nav/" || url.pathname === "/__nav") {
    return sendBuilt(res, "index.html", "text/html; charset=utf-8");
  }

  // Собранные файлы панели. Панель — приложение на нашей же базе: вкладки и список выбора
  // приходят из кита готовыми, а не имитируются разметкой.
  if (url.pathname.startsWith("/__nav/assets/")) {
    const file = url.pathname.slice("/__nav/".length);
    const type = file.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
    return sendBuilt(res, file, type);
  }

  if (url.pathname === "/__nav/presets") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ presets: await presets() }));
    return;
  }

  if (url.pathname === "/__nav/status") {
    const zones = await survey();
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ current, zones }));
    return;
  }

  if (url.pathname === "/__nav/switch") {
    const wanted = url.searchParams.get("zone") ?? "";
    if (CANDIDATES.some((zone) => zone.id === wanted)) current = wanted;
    res.writeHead(204);
    res.end();
    return;
  }

  // Всё остальное — выбранной зоне, путь как есть.
  const proxy = httpRequest(
    { host: "127.0.0.1", port: portOf(current), path: req.url, method: req.method, headers: req.headers },
    (answer) => {
      res.writeHead(answer.statusCode ?? 502, answer.headers);
      answer.pipe(res);
    },
  );
  proxy.on("error", () => {
    if (res.headersSent) return res.end();
    res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
    res.end(
      `<body style="font:14px system-ui;padding:24px;background:#14161a;color:#e6e8ec">
       <p>Зона <b>${current}</b> не отвечает на порту ${portOf(current)}.</p>
       <p>Подними её дев-сервер и нажми ↻ на пульте.</p></body>`,
    );
  });
  req.pipe(proxy);
});

// Горячая перезагрузка держится вебсокетом на том же адресе — без этого правка в редакторе
// не доезжает до окна, и пульт превращается в способ смотреть на устаревшую страницу.
server.on("upgrade", (req, socket, head) => {
  const upstream = connect({ host: "127.0.0.1", port: portOf(current) }, () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(req.headers)
          .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(", ") : value}\r\n`)
          .join("") +
        "\r\n",
    );
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const drop = () => socket.destroy();
  upstream.on("error", drop);
  socket.on("error", () => upstream.destroy());
});

server.listen(PORT, HOST, () => {
  console.log(`[пульт] http://localhost:${PORT}/__nav/`);
  console.log(`[пульт] зоны: ${CANDIDATES.map((zone) => `${zone.id}:${zone.port}`).join(" · ")}`);
});
