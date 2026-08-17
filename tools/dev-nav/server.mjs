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

/**
 * Оформление пульта — те же файлы, что уезжают потребителю, и в том же порядке.
 *
 * Пульт статический: ни сборки, ни фреймворка, ни строки JS ради вида. Если он оденется этими
 * четырьмя файлами — значит инвариант «результат достижим как чистый CSS» (`kb:SKIN-7`, п. 8)
 * не декларация. Здесь он проверяется на живом примере, а не на словах.
 *
 * Порядок НЕ декоративный: пресет без базового CSS даёт вид, посчитанный от умолчаний, и
 * выглядит это как «скин почти работает».
 */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const LOOK = [
  ["style-base", "packages/style/dist/css/base.css"],
  ["style-themes", "packages/style/dist/css/themes.css"],
  ["preset", "products/skin/src/presets/css/dense.css"],
  ["skin", "products/skin/src/skin/skin.css"],
];

/**
 * Отдать файл оформления по имени.
 *
 * Два случая, и второй обязателен: `skin.css` — сборный файл с ОТНОСИТЕЛЬНЫМИ импортами
 * (`@import "./button.css"`). Браузер запросит их по соседству, поэтому каталог оформления
 * отдаётся целиком, а не четырьмя именами из списка.
 *
 * @param {string} name
 */
function look(name) {
  // Имя из списка — файл в известном месте.
  const found = LOOK.find(([id]) => id === name);
  const candidates = found
    ? [found[1]]
    : // Иначе — часть оформления рядом со сборным файлом.
      [`products/skin/src/skin/${name}.css`];

  // Имя приходит из URL: без этой проверки `..` вывел бы чтение за пределы каталога.
  if (!/^[a-z0-9-]+$/.test(name)) return null;

  for (const path of candidates) {
    try {
      return readFileSync(ROOT + path, "utf8");
    } catch {
      /* следующий кандидат */
    }
  }
  return null;
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

const PAGE = `<!doctype html>
<html lang="ru" data-theme="dense" class="dark">
<head>
<meta charset="utf-8">
<title>Пульт — дев-серверы probe-web</title>
<!-- Оформление пульта — те же четыре файла и тот же порядок, что уезжают потребителю.
     Пульт статический: ни сборки, ни фреймворка. Он и есть проверка инварианта «результат
     достижим как чистый CSS» (kb:SKIN-7, п. 8) на живом примере.
     Пресет dense выбран не случайно: skin сделала его «для пультов и таблиц». -->
<link rel="stylesheet" href="/__nav/look/style-base.css">
<link rel="stylesheet" href="/__nav/look/style-themes.css">
<link rel="stylesheet" href="/__nav/look/preset.css">
<link rel="stylesheet" href="/__nav/look/skin.css">
<style>
  /* Каркас пульта: раскладка и ничего больше. Ни одного цвета, кегля и отступа литералом —
     только роли и шкалы слоя стилей. Вид приезжает пресетом, а не пишется здесь. */
  html, body { height: 100%; margin: 0; }
  body {
    display: grid; grid-template-rows: auto 1fr;
    background: var(--background); color: var(--foreground);
    font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
    font-size: var(--font-size-sm);
  }
  header {
    display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
    padding: var(--space-2) var(--space-3);
    background: var(--card); border-bottom: 1px solid var(--border);
  }
  .brand { font-weight: 600; }
  .brand small { color: var(--muted-foreground); font-weight: 400; margin-left: var(--space-1); }
  nav { display: flex; gap: var(--space-1); flex-wrap: wrap; }
  .dot {
    width: 8px; height: 8px; border-radius: var(--radius-full);
    background: var(--muted-foreground); flex: none;
  }
  .up .dot { background: var(--brand-solid); }
  .spacer { flex: 1; }
  .hint { color: var(--muted-foreground); font-size: var(--font-size-xs); }
  iframe { width: 100%; height: 100%; border: 0; background: var(--background); }
  .empty {
    display: grid; place-content: center; gap: var(--space-2);
    text-align: center; color: var(--muted-foreground); padding: var(--space-10);
  }
  code {
    background: var(--muted); color: var(--foreground);
    padding: 0 var(--space-1); border-radius: var(--radius-sm);
  }
</style>
</head>
<body>
<header>
  <span class="brand">Пульт<small>дев-серверы</small></span>
  <nav id="zones"></nav>
  <span class="spacer"></span>
  <span class="hint" id="hint"></span>
  <button data-slot="button" data-variant="ghost" data-size="sm" id="reload" title="Перезагрузить содержимое">↻</button>
</header>
<div id="stage"><div class="empty"><p>Ищу дев-серверы…</p></div></div>
<script>
  const zones = document.getElementById("zones");
  const stage = document.getElementById("stage");
  const hint = document.getElementById("hint");
  let current = null;

  function frame() {
    stage.innerHTML = '<iframe src="/?nav=' + Date.now() + '" title="Дев-сервер"></iframe>';
  }

  async function draw() {
    const state = await (await fetch("/__nav/status")).json();
    current = state.current;
    zones.innerHTML = "";
    for (const zone of state.zones) {
      const button = document.createElement("button");
      // Зацепка кита ДОБАВЛЯЕТСЯ к своей, а не заменяет её: [data-slot~="button"] читается
      // списком (kb:SKIN-7, п. 5). Замена именем "nav-zone" оставила бы узел голым — молча.
      button.setAttribute("data-slot", "button nav-zone");
      button.setAttribute("data-variant", zone.id === current ? "solid" : "outline");
      button.setAttribute("data-size", "sm");
      button.className = zone.up ? "up" : "";
      button.setAttribute("aria-current", String(zone.id === current));
      button.disabled = !zone.up;
      button.title = zone.up ? "порт " + zone.port : "не поднят (порт " + zone.port + ")";
      button.innerHTML = '<span class="dot"></span>' + zone.label;
      button.onclick = async () => {
        await fetch("/__nav/switch?zone=" + encodeURIComponent(zone.id), { method: "POST" });
        await draw();
        frame();
      };
      zones.append(button);
    }
    const live = state.zones.filter((zone) => zone.up).length;
    hint.textContent = live === 0
      ? "ни один дев-сервер не поднят"
      : live + " из " + state.zones.length + " подняты";
    if (live === 0) {
      stage.innerHTML = '<div class="empty"><p>Ни один дев-сервер не отвечает.</p>'
        + '<p>Подними любой: <code>cd products/tables && npx vite --port 5173</code></p></div>';
    } else if (!stage.querySelector("iframe")) {
      frame();
    }
  }

  document.getElementById("reload").onclick = frame;
  draw();
  setInterval(draw, 4000);
</script>
</body>
</html>`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://nav.local");

  if (url.pathname === "/__nav/" || url.pathname === "/__nav") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  if (url.pathname.startsWith("/__nav/look/")) {
    const css = look(url.pathname.slice("/__nav/look/".length).replace(/\.css$/, ""));
    if (css === null) {
      // Файла нет — значит зона его ещё не собрала. Пульт от этого не ломается: он останется
      // неодетым, но рабочим. Ровно то, что инвариант 4 требует от приложения.
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("нет такого файла оформления");
      return;
    }
    res.writeHead(200, { "content-type": "text/css; charset=utf-8", "cache-control": "no-cache" });
    res.end(css);
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
