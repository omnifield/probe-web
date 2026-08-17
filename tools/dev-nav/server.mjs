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

import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";

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
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Пульт — дев-серверы probe-web</title>
<style>
  :root { color-scheme: dark; --bg:#14161a; --panel:#1c1f26; --line:#2b2f38; --ink:#e6e8ec; --dim:#9aa2b1; --live:#4ade80; --dead:#4b5563; --pick:#3b82f6; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; background: var(--bg); color: var(--ink);
    font: 14px/1.45 ui-sans-serif, system-ui, sans-serif; }
  body { display: grid; grid-template-rows: auto 1fr; }
  header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 8px 12px; background: var(--panel); border-bottom: 1px solid var(--line); }
  .brand { font-weight: 600; margin-right: 4px; }
  .brand small { color: var(--dim); font-weight: 400; margin-left: 6px; }
  button { font: inherit; color: var(--ink); background: transparent;
    border: 1px solid var(--line); border-radius: 8px; padding: 5px 10px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 7px; }
  button:hover { border-color: var(--dim); }
  button[aria-current="true"] { border-color: var(--pick); background: #1e293b; }
  button:disabled { cursor: not-allowed; opacity: .5; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dead); flex: none; }
  .up .dot { background: var(--live); }
  .spacer { flex: 1; }
  .hint { color: var(--dim); font-size: 12px; }
  iframe { width: 100%; height: 100%; border: 0; background: #fff; }
  .empty { display: grid; place-content: center; gap: 10px; text-align: center; color: var(--dim); padding: 40px; }
  code { background: #0f1115; padding: 2px 6px; border-radius: 5px; color: var(--ink); }
</style>
</head>
<body>
<header>
  <span class="brand">Пульт<small>дев-серверы</small></span>
  <nav id="zones"></nav>
  <span class="spacer"></span>
  <span class="hint" id="hint"></span>
  <button id="reload" title="Перезагрузить содержимое">↻</button>
</header>
<div id="stage"><div class="empty"><p>Ищу дев-серверы…</p></div></div>
<script>
  const zones = document.getElementById("zones");
  const stage = document.getElementById("stage");
  const hint = document.getElementById("hint");
  let current = null;

  function frame() {
    // Ключ по зоне: смена зоны обязана пересоздать окно, иначе показ останется от прежней.
    stage.innerHTML = '<iframe src="/?nav=' + Date.now() + '" title="Дев-сервер"></iframe>';
  }

  async function draw() {
    const state = await (await fetch("/__nav/status")).json();
    current = state.current;
    zones.innerHTML = "";
    for (const zone of state.zones) {
      const button = document.createElement("button");
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
  // Зоны поднимаются и падают по ходу работы — пульт пересматривает их сам.
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
