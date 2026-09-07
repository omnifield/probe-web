# 🤖 web-core MCP

🏷️ mcp · 🧬 tooling · 📦 `@web-core/mcp`

## 🧭 Навигация

- ✨ [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">✨ Главное</h2>

🤖 Тулинг для MCP-серверов зон web-core — используйте, если заводите новый MCP-сервер (`skin` —
первый, дальше другие зоны) и не хотите каждый раз заново решать одни и те же вопросы: как
обязать `annotations` на каждом туле, как правильно завернуть отказ по спеке (`isError`), как
поднять сервер локально (stdio), а потом на сервере (Streamable HTTP, с отдельной сессией на
каждого клиента и безопасным умолчанием по адресу) без переписывания зоны с нуля. Пять точек
поверхности закрывают путь целиком: регистрация тула с обязательными annotations и конвертом
ответа (`@web-core/mcp`), бутстрап транспорта с точкой расширения под auth (`/transport`),
курсорная пагинация листингов (`/pagination`), точечный обмен данными с ДРУГИМ MCP-инстансом по
HTTP или stdio (`/peer`), headless-браузер как MCP-клиент чужого сервера, не своя реализация
рендера (`/browser`). Output-схема тула — не отдельная функция: SDK
(`@modelcontextprotocol/sdk`) сам принимает настоящую Zod-схему и для входа, и для выхода, сам
валидирует и сам строит JSON Schema для протокола.

<h2 id="анатомия">🧩 Анатомия</h2>

У оснастки без общего движка внутри «часть» 🧩 — точка входа/подпуть поставки в своём каталоге, а
«адрес» — импорт-спецификатор, которым эта часть достаётся.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Регистрация тула + конверт ответа | `@web-core/mcp` | `registerTool`, `ok`, `err` |
| Бутстрап транспорта | `@web-core/mcp/transport` | `createServer` |
| Пагинация листингов | `@web-core/mcp/pagination` | `paginate` |
| Обмен с другим MCP-инстансом | `@web-core/mcp/peer` | `httpPeer`, `stdioPeer` |
| Headless-браузер | `@web-core/mcp/browser` | `createBrowser` |

📂 Пять независимых инструментов (регистрация тула ничего не знает о транспорте, пагинация не знает
ни о том, ни о другом — общая у них только тема, не механизм). В корне `src/` лежит только
`index.ts` — тонкий барель (`export * from "./register-tool/index.js"`), сам он ни строки логики
не несёт. Общее (то, чем пользуется буквально каждый MCP-сервер зоны) едет через этот барель —
`register-tool/` поэтому переиспользуется корневым адресом. Тяжёлое и опциональное — своим
каталогом и своим подпутём, не через барель: `transport/` тянет `node:http`/`node:crypto` и нужен
не всегда (тул можно регистрировать и на сервере, поднятом снаружи), `pagination/` — отдельная
маленькая тема, не про регистрацию тула вовсе. Тот же приём, что у `packages/store`
(`engine/` → `.`, `machine/`/`addons/` → свои подпути).

<h2 id="использование">🚀 Использование</h2>

**Регистрация тула:**

```ts
import { registerTool, ok } from "@web-core/mcp";
import { z } from "@web-core/io";

registerTool(server, {
  name: "save_preset",
  title: "Сохранить запись",
  description: "Кладёт запись в службу после проверки.",
  access: "write", // "read" | "write" | "destructive" — определяет readOnlyHint/destructiveHint
  input: z.object({ kind: KIND, state: z.looseObject({ name: z.string() }) }),
  handler: async ({ kind, state }) => ok(await store.replace(kind, state.name, state)),
});
```

**Output-схема:**

```ts
registerTool(server, {
  name: "get_passport",
  description: "Паспорт компонента.",
  access: "read",
  input: z.object({ component: z.string() }),
  output: PassportOutput, // настоящая Zod-схема — SDK сам валидирует и строит JSON Schema
  handler: async ({ component }) => ok(getPassport(component)),
});
```

**Транспорт:**

```ts
import { createServer } from "@web-core/mcp/transport";

const server = createServer({
  name: "web-core-skin",
  version: "0.0.0",
  instructions: "check_* перед save_preset; отрицательный отчёт — не отказ, а результат",
  registerTools: (mcp) => {
    // registerTool(mcp, ...) для каждого тула зоны — вызывается заново на каждую HTTP-сессию
  },
});
await server.listen(); // stdio в деве, Streamable HTTP в проде — по конфигу/env, без правки зоны
// await server.close(); — штатное завершение (и HTTP-сокет, если он поднят)
```

**Пагинация:**

```ts
import { registerTool, ok } from "@web-core/mcp";
import { paginate } from "@web-core/mcp/pagination";

registerTool(server, {
  name: "list_presets",
  description: "Перечень сохранённого.",
  access: "read",
  input: z.object({ kind: KIND.optional(), cursor: z.string().optional() }),
  handler: async ({ kind, cursor }) => ok(paginate(await store.list(kind), { cursor })),
});
```

**Обмен с другим инстансом (`peer`):**

```ts
import { httpPeer, stdioPeer } from "@web-core/mcp/peer";

const prod = httpPeer(process.env["PROD_SKIN_MCP_URL"]!); // подключение — лениво, на первый вызов
await prod.callTool("save_preset", { kind: "form", state, author: "you", adminToken: "..." });

const chrome = stdioPeer("npx", ["chrome-devtools-mcp@1.8.0", "--headless"]);
await chrome.callTool("navigate_page", { pageId: 1, type: "url", url: "https://example.com" });

// env не задан — дочерний процесс получает от SDK обрезанный безопасный набор (PATH/HOME/...), не
// весь process.env. Своему доверенному процессу (второй локальный инстанс своей же зоны) — передать явно:
const localZone = stdioPeer("pnpm", ["start"], { name: "sync-script", env: process.env });
```

**Headless-браузер (`browser`):**

```ts
import { createBrowser } from "@web-core/mcp/browser";

const browser = createBrowser({ executablePath: process.env["CHROME_EXECUTABLE"] });
const pageId = await browser.newPage(); // один вызов — одна вкладка; своя карта сессия→вкладка на стороне зоны
await browser.navigate(pageId, "http://127.0.0.1:5174/showcase/button/default");
const { mimeType, base64 } = await browser.screenshot(pageId);
```

<h2 id="настройки">🎚️ Настройки</h2>

🎛️ У оснастки нет одной сущности с общим списком настроек — опции у каждой функции свои.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `access` | `registerTool`, `definition.access` | `"read" \| "write" \| "destructive"` | обязательное — регистрация падает без него |
| `idempotent` | `registerTool`, `definition.idempotent` | `boolean` | `false` |
| `openWorld` | `registerTool`, `definition.openWorld` | `boolean` | `false` |
| `output` | `registerTool`, `definition.output` | Zod-схема | не задан — `outputSchema` не прикладывается |
| `transport` | `createServer`, `options.transport` | `"stdio" \| "http"` | `"stdio"` |
| `auth` | `createServer`, `options.auth` | `(req: IncomingMessage) => boolean \| Promise<boolean>` | не задан — без проверки |
| `host` | `createServer`, `options.host` (только `"http"`) | `string` | `"127.0.0.1"` — наружу машины не выходит без явного решения |
| `allowedHosts` | `createServer`, `options.allowedHosts` (только `"http"`) | `readonly string[]` | не задан — заголовок `Host` не проверяется |
| `allowedOrigins` | `createServer`, `options.allowedOrigins` (только `"http"`) | `readonly string[]` | не задан — заголовок `Origin` не проверяется |
| `instructions` | `createServer`, `options.instructions` | `string` | не задан |
| `limit` | `paginate`, `options.limit` | `number` | `50` |
| `info` | `httpPeer`, второй аргумент | `{ name?, version? }` | `{name:"web-core-mcp-peer", version:"0.0.0"}` |
| `env` | `stdioPeer`, третий аргумент (`StdioPeerOptions`, наравне с `name?`/`version?`) | `Record<string,string\|undefined>` | не задан — SDK сам даёт обрезанный безопасный набор (PATH/HOME/...), НЕ весь `process.env` |
| `executablePath`/`headless`/`isolated`/`chromeArgs`/`version` | `createBrowser`, `options` | см. `BrowserOptions` | `headless/isolated: true`, `chromeArgs: ["--no-sandbox", "--disable-dev-shm-usage"]`, `version: "1.8.0"` |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Настоящих runtime-состояний у статичных функций нет — есть режимы, в которых они ведут себя
по-разному, и результат проверки на границе (annotations/auth).

| Состояние | Метка | Где |
|---|---|---|
| Тул зарегистрирован без обязательных annotations | бросает при регистрации, не при вызове | `registerTool` |
| Хендлер отдал успех | `content` (+ `structuredContent`, если значение — объект), `isError: false` | `ok()` |
| Хендлер отказал | `content` текстом, `isError: true` | `err()` |
| Транспорт локальный | `stdio`, один `McpServer` на процесс | `createServer` |
| Транспорт серверный, новая сессия | нет заголовка `mcp-session-id` от клиента — новый `McpServer` + `registerTools()` заново | `createServer` |
| Транспорт серверный, известная сессия | `mcp-session-id` найден в карте — переиспользуется её `McpServer`/`transport`, не создаётся заново | `createServer` |
| Транспорт серверный, НЕИЗВЕСТНАЯ сессия | заголовок есть, в карте его нет — `404` СРАЗУ, `McpServer` не строится вовсе | `createServer` |
| Host не в allowlist | `400`, транспорт не вызывается | `createServer` |
| Origin не в allowlist | `400`, транспорт не вызывается | `createServer` |
| Auth-хук отказал | `401`, транспорт не вызывается | `createServer` |
| Страница листинга не последняя | `nextCursor` в ответе | `paginate` |
| Страница листинга последняя | `nextCursor` отсутствует | `paginate` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `registerTool(server, definition)` | `ToolDefinition` (`name`, `title?`, `description`, `access`, `idempotent?`, `openWorld?`, `input?`, `output?`, `handler`) — `input`/`output` настоящие Zod-схемы |
| `ok(value?)` / `err(message)` | значение под `output`-схему тула / текст отказа |
| `createServer(options)` | `{ name, version, instructions?, registerTools, transport?, auth?, host?, allowedHosts?, allowedOrigins? }` |
| `server.listen(port?)` / `server.close()` | ничего / ничего |
| `paginate(items, options)` | массив + `{ cursor?, limit? }` |
| `httpPeer(url, info?)` / `stdioPeer(command, args?, options?)` | адрес/команда чужого MCP-сервера (`options` — `{name?, version?, env?}`) |
| `createBrowser(options?)` | `BrowserOptions` (все поля необязательны) |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `registerTool` | ничего вызывающему — регистрирует тул на переданном `server` |
| `ok`/`err` | конверт результата тула по спеке MCP (`content`, `structuredContent?`, `isError`) |
| `createServer` | `ZoneServer` (`{ listen(port?), close() }`) — сырой `McpServer` наружу не отдаётся, он свой на каждую HTTP-сессию |
| `paginate` | `{ items, nextCursor? }` |
| `Peer.callTool`/`.close` | `CallToolResult` настоящего чужого MCP-сервера / ничего |
| `Browser.newPage`/`.navigate`/`.screenshot` | номер вкладки / текстовый отчёт / `{mimeType, base64}` |

<h2 id="сборки">🏗️ Сборки</h2>

✅ Настоящий round-trip через MCP SDK, не имитация — каждая строка ниже доказана тестом
(`vitest run`, 27/27 зелёных).

| Проверено | Как | Результат |
|---|---|---|
| `access` → `readOnlyHint`/`destructiveHint` | `InMemoryTransport.createLinkedPair()`, реальный `Client.listTools()` | annotations на проводе совпадают с `access` |
| `input`/`output` как настоящие Zod-схемы | тот же клиент, `callTool` с аргументом, `structuredContent` в ответе | SDK сам провалидировал и собрал `structuredContent` |
| `err()` — настоящий `isError: true` | `callTool` на тул, вызывающий `err()` | `result.isError === true` |
| Регистрация без `access` | вызов `registerTool` с `as never` мимо типов | бросает с сообщением, называющим тул |
| Streamable HTTP — тул отвечает | реальный `fetch`/`StreamableHTTPClientTransport` на поднятый `createServer({transport:"http"})` | `200`, `isError: false` |
| Auth-хук отказывает | `StreamableHTTPClientTransport` без верного заголовка | `client.connect()` падает (сервер отвечает `401`) |
| Auth-хук пропускает | тот же клиент с верным `Authorization` | тул отвечает штатно |
| Два клиента одновременно | два `StreamableHTTPClientTransport` на один `createServer`, оба зовут тул | разные `sessionId`, первый жив после подключения второго |
| Host не в allowlist | `fetch` с несовпадающим заголовком `Host` | `400`, тул не вызван |
| Origin не в allowlist | `fetch` с несовпадающим заголовком `Origin` | `400`, тул не вызван |
| Неизвестный `mcp-session-id` не строит сервер | `fetch` с выдуманным `mcp-session-id`, счётчик вызовов `registerTools` | `404`, счётчик остался `0` |
| `instructions` доезжают клиенту | `client.getInstructions()` после `connect()` | совпадает с переданной строкой |
| Пагинация — полный обход | `paginate` в цикле по `nextCursor` до его исчезновения | ни одного пропуска/повтора элемента |
| `httpPeer` — реальный тул на реальном сервере | `createServer({transport:"http"})` + `httpPeer(url).callTool(...)` | тот же ответ, что и у настоящего `Client` |
| `httpPeer` — ленивое подключение | `httpPeer` на порт, где никто не слушает, без вызова `callTool` | конструктор не падает и не виснет |
| `stdioPeer` — реальный процесс по stdio | `stdioPeer("node", [фикстура])` на настоящий дочерний процесс | тот же ответ, что и у настоящего `Client` |
| `stdioPeer` — один процесс, не один на вызов | два `callTool` подряд, ответ несёт `process.pid` фикстуры | `pid` совпадает между вызовами |
| `stdioPeer` не отдаёт своё окружение по умолчанию | фикстура читает свою переменную из `process.env`, `env` не передан | пусто — переменная не долетела до дочернего процесса |
| `stdioPeer` передаёт `env`, когда его дали явно | тот же тест, `stdioPeer(..., {env: process.env})` | значение переменной долетело неизменным |
| `createBrowser` — реальный headless Chromium | `newPage`→`navigate`→`screenshot` на настоящем `chrome-devtools-mcp` | реальный PNG (`data:` URL, без сети) |

<h2 id="рецепт">🎨 Рецепт</h2>

🔌 Съёмный слой — сама проверка токена в `createServer`: пакет не решает, ЧЕМ и КАК проверяется
bearer/scopes, только вызывает переданную функцию на каждый HTTP-запрос и отвечает `401`, если она
вернула `false` (или бросила).

```ts
import { createServer } from "@web-core/mcp/transport";

const server = createServer({
  name: "web-core-skin",
  version: "0.0.0",
  transport: "http",
  auth: (req) => req.headers.authorization === `Bearer ${process.env["SKIN_MCP_TOKEN"]}`,
  registerTools: (mcp) => {
    /* registerTool(mcp, ...) для каждого тула зоны */
  },
});
```

✨ Механизм здесь один и общий (вызвать хук, отказать без него) — содержимое самой проверки
(поход к конкретному auth-сервису продукта) каждая зона пишет свою, это не задача этого пакета.
