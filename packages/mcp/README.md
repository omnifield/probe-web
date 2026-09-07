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
каждого клиента и безопасным умолчанием по адресу) без переписывания зоны с нуля. Три точки
поверхности закрывают путь целиком: регистрация тула с обязательными annotations и конвертом
ответа (`@web-core/mcp`), бутстрап транспорта с точкой расширения под auth (`/transport`),
курсорная пагинация листингов (`/pagination`). Output-схема тула — не отдельная функция: SDK
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

📂 Три независимых инструмента (регистрация тула ничего не знает о транспорте, пагинация не знает
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

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `registerTool` | ничего вызывающему — регистрирует тул на переданном `server` |
| `ok`/`err` | конверт результата тула по спеке MCP (`content`, `structuredContent?`, `isError`) |
| `createServer` | `ZoneServer` (`{ listen(port?), close() }`) — сырой `McpServer` наружу не отдаётся, он свой на каждую HTTP-сессию |
| `paginate` | `{ items, nextCursor? }` |

<h2 id="сборки">🏗️ Сборки</h2>

✅ Настоящий round-trip через MCP SDK, не имитация — каждая строка ниже доказана тестом
(`vitest run`, 20/20 зелёных).

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
