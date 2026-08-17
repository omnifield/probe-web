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

import { readdirSync, readFileSync } from "node:fs";
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
 * Перечень пресетов оформления.
 *
 * Берётся ИЗ ФАЙЛОВ зоны `skin`, а не объявляется здесь заново: перечень, объявленный вторым
 * местом, разъезжается на первой правке — и разъезжается молча (`kb:SKIN-7`, инвариант 11).
 * Имя файла — идентификатор, который уезжает в `data-theme`; человеческое название лежит в
 * шапке самого файла.
 *
 * Пресеты со службы добавятся сюда же, когда `skin` научится их туда сохранять
 * (`tasker:PROBEWEB-55`): список собирается из источников, а не из одного места.
 */
function presets() {
  const dir = ROOT + "products/skin/src/presets/css/";
  /** @type {Array<{id: string, title: string, origin: string}>} */
  const found = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return found;
  }
  for (const file of names) {
    if (!file.endsWith(".css")) continue;
    const id = file.slice(0, -4);
    let title = id;
    try {
      const said = /«([^»]+)»/.exec(readFileSync(dir + file, "utf8").slice(0, 200));
      if (said) title = said[1];
    } catch {
      /* название необязательно: без него сойдёт идентификатор */
    }
    found.push({ id, title, origin: "встроенный" });
  }
  return found;
}

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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Девпанель — probe-web</title>
<!-- Оформление панели — те же файлы и тот же порядок, что уезжают потребителю.
     Панель статическая: ни сборки, ни фреймворка. Она и есть проверка инварианта
     «результат достижим как чистый CSS» (kb:SKIN-7, п. 8) на живом примере. -->
<link rel="stylesheet" href="/__nav/look/style-base.css">
<link rel="stylesheet" href="/__nav/look/style-themes.css">
<link rel="stylesheet" href="/__nav/look/preset.css">
<link rel="stylesheet" href="/__nav/look/skin.css">
<style>
  /* Раскладка панели. Ни одного цвета, кегля и отступа литералом — только роли и шкалы слоя.
     Скроллит РОВНО ОДНО место: ряд зон, когда их больше, чем влезает. Ни страница, ни шапка
     не прокручиваются — иначе рабочая область уезжает из виду, а именно в ней смысл панели. */
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; overflow: hidden; }
  body {
    display: grid; grid-template-rows: auto 1fr; min-height: 0;
    background: var(--background); color: var(--foreground);
    font-family: var(--font-sans, ui-sans-serif, system-ui, sans-serif);
    font-size: var(--font-size-sm);
  }

  header {
    display: flex; align-items: center; gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--card); border-bottom: 1px solid var(--border);
    min-width: 0; /* иначе flex-ребёнок не даёт полосе сжаться и шапка распирает окно */
  }
  .brand { font-weight: 600; white-space: nowrap; }
  .brand small { color: var(--muted-foreground); font-weight: 400; margin-left: var(--space-1); }

  /* Зоны: одна строка, горизонтальная прокрутка при нехватке места.
     Перенос строкой был бы хуже — шапка растёт и съедает рабочую область. */
  .zones {
    display: flex; gap: var(--space-1); min-width: 0; flex: 1;
    overflow-x: auto; overflow-y: hidden;
    scrollbar-width: thin; padding-bottom: 2px;
  }
  .zones > * { flex: none; }

  .look { display: flex; align-items: center; gap: var(--space-1); flex: none; }
  .look-title {
    color: var(--muted-foreground); font-size: var(--font-size-xs);
    white-space: nowrap; margin-right: var(--space-1);
  }

  .dot {
    width: 8px; height: 8px; border-radius: var(--radius-full);
    background: var(--muted-foreground); flex: none;
  }
  .up .dot { background: var(--brand-solid); }

  .stage { min-height: 0; position: relative; }
  iframe { width: 100%; height: 100%; border: 0; display: block; background: var(--background); }

  .empty {
    height: 100%; display: grid; place-content: center; gap: var(--space-2);
    text-align: center; color: var(--muted-foreground); padding: var(--space-6);
  }
  code {
    background: var(--muted); color: var(--foreground);
    padding: 0 var(--space-1); border-radius: var(--radius-sm);
  }
</style>
</head>
<body>
<header>
  <span class="brand">Девпанель<small id="hint"></small></span>
  <nav class="zones" id="zones"></nav>
  <div class="look">
    <span class="look-title">оформление</span>
    <span id="presets" class="look"></span>
    <button data-slot="button" data-variant="outline" data-size="sm" id="mode" title="Светлая или тёмная пара">◐</button>
    <button data-slot="button" data-variant="ghost" data-size="sm" id="reload" title="Перезагрузить зону">↻</button>
  </div>
</header>
<div class="stage" id="stage"><div class="empty"><p>Ищу дев-серверы…</p></div></div>
<script>
  const zonesEl = document.getElementById("zones");
  const presetsEl = document.getElementById("presets");
  const stage = document.getElementById("stage");
  const hint = document.getElementById("hint");

  const LOOK_KEY = "probe-web-dev-look";   // общий выбор панели: {preset, mode}
  let current = null;

  const look = () => {
    try { return JSON.parse(localStorage.getItem(LOOK_KEY)) || {}; } catch { return {}; }
  };
  const setLook = (patch) => {
    const next = { ...look(), ...patch };
    localStorage.setItem(LOOK_KEY, JSON.stringify(next));
    applySelf(next);
    applyFrame(next);
    return next;
  };

  // Панель одевается тем же выбором, что раздаёт: иначе она врёт о том, что показывает.
  function applySelf(state) {
    if (state.preset) document.documentElement.dataset.theme = state.preset;
    document.documentElement.classList.toggle("dark", state.mode !== "light");
  }

  // ВРЕМЕННО: панель ставит выбор зоне напрямую. Это костыль до механики (tasker:PROBEWEB-52),
  // где зона читает общий выбор САМА при запуске. Пока механики нет, иначе выбор не доедет.
  // Работает только потому, что зоны проксируются через этот же порт — origin общий.
  function applyFrame(state) {
    const frame = stage.querySelector("iframe");
    const root = frame?.contentDocument?.documentElement;
    if (!root) return;
    // Своё берёт верх над общим: зона, у которой выбор задан её собственным интерфейсом,
    // панель не перебивает (kb:PROBEWEB-13). Признак — атрибут, поставленный самой зоной.
    if (root.dataset.lookOwn === "true") return;
    if (state.preset) root.dataset.theme = state.preset;
    root.classList.toggle("dark", state.mode !== "light");
  }

  function frame() {
    stage.innerHTML = '<iframe src="/?nav=' + Date.now() + '" title="Зона"></iframe>';
    const el = stage.querySelector("iframe");
    el.addEventListener("load", () => applyFrame(look()));
  }

  async function drawPresets() {
    const { presets } = await (await fetch("/__nav/presets")).json();
    const chosen = look().preset;
    presetsEl.innerHTML = "";
    for (const preset of presets) {
      const button = document.createElement("button");
      // Зацепка кита ДОБАВЛЯЕТСЯ к своей, а не заменяет её: список читается через ~=,
      // замена оставила бы узел голым молча (kb:SKIN-7, п. 5).
      button.setAttribute("data-slot", "button nav-preset");
      button.setAttribute("data-variant", preset.id === chosen ? "solid" : "outline");
      button.setAttribute("data-size", "sm");
      button.textContent = preset.title;
      button.title = preset.origin + ' · data-theme="' + preset.id + '"';
      button.onclick = () => { setLook({ preset: preset.id }); drawPresets(); };
      presetsEl.append(button);
    }
    if (presets.length === 0) presetsEl.innerHTML = '<span class="look-title">пресетов нет</span>';
  }

  async function drawZones() {
    const state = await (await fetch("/__nav/status")).json();
    current = state.current;
    zonesEl.innerHTML = "";
    for (const zone of state.zones) {
      const button = document.createElement("button");
      button.setAttribute("data-slot", "button nav-zone");
      button.setAttribute("data-variant", zone.id === current ? "solid" : "outline");
      button.setAttribute("data-size", "sm");
      button.className = zone.up ? "up" : "";
      button.disabled = !zone.up;
      button.title = zone.up ? "порт " + zone.port : "не поднят (порт " + zone.port + ")";
      button.innerHTML = '<span class="dot"></span>' + zone.label;
      button.onclick = async () => {
        await fetch("/__nav/switch?zone=" + encodeURIComponent(zone.id), { method: "POST" });
        await drawZones();
        frame();
      };
      zonesEl.append(button);
    }
    const live = state.zones.filter((z) => z.up).length;
    hint.textContent = live === 0 ? "ни одна зона не поднята" : live + " из " + state.zones.length;
    if (live === 0) {
      stage.innerHTML = '<div class="empty"><p>Ни одна зона не отвечает.</p>'
        + '<p>Подними любую: <code>cd products/tables && npx vite --port 5173 --strictPort</code></p></div>';
    } else if (!stage.querySelector("iframe")) {
      frame();
    }
  }

  document.getElementById("reload").onclick = frame;
  document.getElementById("mode").onclick = () => {
    setLook({ mode: look().mode === "light" ? "dark" : "light" });
  };

  applySelf(look());
  drawPresets();
  drawZones();
  // Зоны поднимаются и падают по ходу работы; пресеты появляются, когда их сохранили.
  // Опрос вместо канала — сознательно: канал заводится, когда задержка начнёт мешать.
  setInterval(drawZones, 4000);
  setInterval(drawPresets, 10000);
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

  if (url.pathname === "/__nav/presets") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ presets: presets() }));
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
