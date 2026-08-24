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
// Прокси, опрос зон и служба — голый Node. А САМУ ПАНЕЛЬ держит дев-сервер vite в
// middleware-режиме: панель — такой же фронт, как зоны, и требовать собирать её руками, чтобы
// увидеть собственную правку, незачем.
//
// Раньше здесь лежала собранная копия (`app/dist`), закоммиченная в репозиторий, и сервер
// читал её с диска. Копия молча отставала от исходников — ровно так пульт и оказался без
// палитры, добавленной в базу неделей раньше. Сборку в репозитории не держим: у панели теперь
// горячая перезагрузка, как у любой зоны.

import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import { connect } from "node:net";
import { fileURLToPath, pathToFileURL } from "node:url";

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

/** Корень репозитория. */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Каталог панели — корень её дев-сервера. */
const APP = `${ROOT}tools/dev-nav/app`;

/** Префикс, под которым панель живёт на общем порту. Он же база для vite. */
const BASE = "/__nav/";

/**
 * Перечень пресетов оформления — ИЗ СЛУЖБЫ, и только из неё.
 *
 * Файлы пресетов, лежащие в зоне `skin`, панель НЕ показывает: это её встроенные заготовки,
 * а не то, что кто-то сохранил и чем собирается пользоваться. Решение user 2026-08-17:
 * нет сохранённых пресетов — нет и выбора, панель живёт на базовом оформлении.
 *
 * Служба различает виды ярлыком (`PROBEWEB-8`), наш — `skin`. Пока `skin` не научится туда
 * сохранять (`PROBEWEB-55`), список пуст — и это правильное состояние, а не сбой.
 */
/**
 * Спросить службу и отдать ответ как есть.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {string} path
 */
function proxyToService(res, path) {
  const call = httpRequest({ host: "127.0.0.1", port: 8787, path, method: "GET" }, (answer) => {
    res.writeHead(answer.statusCode ?? 502, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-cache",
    });
    answer.pipe(res);
  });
  call.on("error", () => {
    res.writeHead(503, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "service_down", message: "Служба пресетов не отвечает." }));
  });
  call.end();
}

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
 * Дев-сервер панели.
 *
 * `middlewareMode` — штатный способ vite встроиться в чужой HTTP-сервер: он отдаёт свои
 * middlewares, а слушает порт по-прежнему наш сервер. Так панель и зоны живут на одном порту,
 * и наружу по-прежнему торчит один.
 *
 * Резолвим vite ОТ КАТАЛОГА ПАНЕЛИ: этот файл лежит вне пакетов, и от корня репозитория vite
 * не разрешается — в pnpm-воркспейсе он стоит у того, кто его объявил.
 */
async function startPanel(httpServer) {
  const require = createRequire(`${APP}/package.json`);
  const { createServer: createVite } = await import(
    pathToFileURL(require.resolve("vite")).href
  );
  return createVite({
    root: APP,
    base: BASE,
    // `custom` — «страницу отдаю я сам»: индекс ниже прогоняется через `transformIndexHtml`,
    // иначе в него не попадут ни клиент горячей перезагрузки, ни преобразование модулей.
    appType: "custom",
    server: {
      middlewareMode: true,
      // Вебсокет перезагрузки садится на НАШ сервер: своего порта у него нет, а значит и
      // пробрасывать наружу нечего.
      hmr: { server: httpServer },
    },
  });
}

/**
 * Отдать страницу панели.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {string} path
 */
async function sendPanel(res, path) {
  const raw = readFileSync(`${APP}/index.html`, "utf-8");
  const html = await panel.transformIndexHtml(path, raw);
  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
  res.end(html);
}

/** Счётчик обращений: петля в панели видна здесь раньше, чем в браузере. */
const hits = new Map();
setInterval(() => {
  if (hits.size === 0) return;
  const top = [...hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  console.log("[пульт] за 5 с:", top.map(([path, n]) => `${path}×${n}`).join(" · "));
  hits.clear();
}, 5000).unref();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://nav.local");
  const key = url.pathname.startsWith("/__nav/") ? url.pathname : "→зона";
  hits.set(key, (hits.get(key) ?? 0) + 1);

  if (url.pathname === "/__nav/" || url.pathname === "/__nav") {
    return sendPanel(res, url.pathname);
  }

  // Одна запись целиком (в перечне содержимого нет). Панель берёт отсюда МОДЕЛЬ пресета и
  // собирает из неё CSS. Файлов пресетов не существует: пресеты живут в службе.
  if (url.pathname.startsWith("/__nav/preset/")) {
    const id = url.pathname.slice("/__nav/preset/".length);
    return proxyToService(res, `/api/presets/${encodeURIComponent(id)}`);
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

  // Остальное под префиксом — исходники панели, её зависимости и клиент горячей перезагрузки.
  // Стоит ПОСЛЕ собственных маршрутов: иначе vite ответил бы на них 404 раньше нас.
  if (url.pathname.startsWith(BASE)) {
    return panel.middlewares(req, res, () => {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("нет такой страницы панели");
    });
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
  // Перезагрузка САМОЙ панели — забота её дев-сервера, он уже сидит на этом же сервере.
  // Без этой строки её вебсокет уехал бы в зону и там оборвался.
  if ((req.url ?? "").startsWith(BASE)) return;

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

const panel = await startPanel(server);

server.listen(PORT, HOST, () => {
  console.log(`[пульт] http://localhost:${PORT}/__nav/`);
  console.log(`[пульт] зоны: ${CANDIDATES.map((zone) => `${zone.id}:${zone.port}`).join(" · ")}`);
});
