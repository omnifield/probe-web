# ⚙️ web-core Neurobox

🏷️ ai-runtime · 🧬 engine · 📦 `@web-core/neurobox`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

🧭 Клиент web-core для бокса нейробокс — менеджера рантаймов агентов (Claude Code, локальная
модель, чужая по ключу), говорящего открытым протоколом **AG-UI** (`RunAgentInput` на входе,
поток событий `RUN_STARTED`/`TEXT_MESSAGE_CHUNK`/`TOOL_CALL_*`/`RUN_FINISHED` на выходе). Полное
описание протокола бокса, заголовков доступа, потоков/прогонов, отказов — корневой
[`NEUROBOX_CLIENT.md`](../../NEUROBOX_CLIENT.md), это не пересказывается здесь.

Пакет — единственная точка резолва `@tanstack/ai-client`/`@tanstack/ai-solid` (TanStack AI,
полностью совместим с AG-UI в обе стороны) вместо вендора, тем же приёмом, что
`@web-core/router`/`@web-core/query`/`@web-core/form`. Поверх вендора пакет несёт свой
`ConnectConnectionAdapter` под сам протокол бокса — штатный `fetchServerSentEvents` не собирает
его конверт (разбор в `FAQ.md`).

Что сделано и что дальше — `ROADMAP.yaml`.

<h2 id="анатомия">🧩 Анатомия</h2>

| Часть | Адрес | Экспортирует |
|---|---|---|
| Транспорт (framework-agnostic) | `@web-core/neurobox` | весь `@tanstack/ai-client` + свой `createNeuroboxConnection` (`ConnectConnectionAdapter` под бокс) |
| Solid-обвязка | `@web-core/neurobox/solid` | весь `@tanstack/ai-solid` (`useChat`, `createChatHook`, connection-адаптеры) — пока без добавок |
| MCP-клиент (Node-only) | `@web-core/neurobox/mcp` | `httpPeer`/`stdioPeer` поверх `@tanstack/ai-mcp` + `createBrowser` — замена `@web-core/mcp/peer`+`/browser` |
| MCP-сервер (Node-only) | `@web-core/neurobox/server` | `registerTool`/`ok`/`err` + `createServer`/`ZoneServer` — перенос `@web-core/mcp` (корень+`/transport`) |
| Пагинация | `@web-core/neurobox/pagination` | `paginate`/`limitSchema` — перенос `@web-core/mcp/pagination` |
| Фидбэк зоны (Node/browser) | `@web-core/neurobox/zone-feedback` | `reportFeedback`/`listFeedback`/`resolveFeedback` (GraphQL к `backend/presets`) — перенос `@web-core/mcp/feedback`. НЕ то же, что `sendNeuroboxFeedback` выше (тот — фидбэк о боксе, этот — о тулах зоны) |
| Механика тулов | `@web-core/neurobox/tool` | `toolDefinition`/`accessOf` поверх `@tanstack/ai` — тот же `access`, что был у `registerTool`, но на уровне определения тула, не только его MCP-регистрации |

<h2 id="использование">🚀 Использование</h2>

```ts
import { useChat } from "@web-core/neurobox/solid";
import { createNeuroboxConnection } from "@web-core/neurobox";

const connection = createNeuroboxConnection({
  baseUrl: "https://neurobox.example",
  token: () => readBoxToken(),
  userLogin: () => readUserLogin(),
});

const chat = useChat({
  connection,
  forwardedProps: { recipe: "сборка-скинов", passport: "опус-5", agent: "claude-code" },
  // TOOL_CALL_RESULT — что ручка реально ответила, ДО конца прогона (NEUROBOX_CLIENT.md, раздел
  // «Ответ»). Своей обвязки под это в пакете нет и не будет — onChunk зовётся на каждый кадр сам.
  onChunk(chunk) {
    if (chunk.type !== "TOOL_CALL_RESULT") return;
    // chunk.toolCallId — тот же, что был у TOOL_CALL_START/ARGS этого вызова;
    // chunk.content — тело ответа. Здесь: перезапросить и переключить показ.
  },
});

// context — что апп знает о месте, едет отдельно от forwardedProps (см. NEUROBOX_CLIENT.md,
// раздел «Прогон») — кладётся в per-сообщение body/data под ключом `context`:
chat.sendMessage("сделай кнопку пошире", {
  body: { context: [{ description: "component", value: "button" }] },
});
```

`chat.stop()` — штатная отмена: `connect()` сам добивает `POST /cancel` по `abortSignal`, отдельно
вызывать ручку бокса не нужно (детали и известная ловушка — `FAQ.md`).

`threadId` в `runContext` — обязателен, `connect()` бросает, если его нет (не заводит тихо новый
поток на каждый ход). Через `useChat` он всегда есть сам по себе; ошибка возможна только при
прямом вызове `connect()` в обход `ChatClient`.

Свои ручки бокса ("Свои ручки в браузере", `NEUROBOX_CLIENT.md`) — `localStorage`, состояние
экрана, что угодно, чего нет на сервере. **НЕ регистрируй их тем же тулом в `useChat({ tools:
[...] })`** — штатный путь `ChatClient` не совпадает с протоколом бокса (см. `FAQ.md`), `connect()`
доставляет результат сам:

```ts
const connection = createNeuroboxConnection({
  baseUrl: "https://neurobox.example",
  token: () => readBoxToken(),
  userLogin: () => readUserLogin(),
  clientTools: [
    {
      name: "save_favorite",
      description: "сохраняет пресет в избранное этого браузера",
      parameters: { type: "object", properties: { preset: { type: "string" } }, required: ["preset"] },
      execute: async ({ preset }) => {
        favorites.add(preset);
        return `сохранено, теперь их ${favorites.size}`;
      },
    },
  ],
});
```

Расход — снимок как есть, без вычисления дельт между вызовами (почему — `FAQ.md`, раздел «Расход»):

```ts
import { fetchNeuroboxSpend } from "@web-core/neurobox";

const spend = await fetchNeuroboxSpend("сеанс-работы-42", {
  baseUrl: "https://neurobox.example",
  token: () => readBoxToken(),
  userLogin: () => readUserLogin(),
});
// spend.cache_read_tokens — надёжнее cost_micros для «сколько стоит длинный разговор»
```

Отзывы — типизированная запись, `praise` наравне с `friction` (просьба самого бокса — по одним
жалобам не видно, что работает):

```ts
import { sendNeuroboxFeedback } from "@web-core/neurobox";

await sendNeuroboxFeedback(
  "сеанс-работы-42",
  { kind: "friction", what: "рецепт не дал нужной ручки", where: "showcase", workaround: "написал вручную" },
  { baseUrl: "https://neurobox.example", token: () => readBoxToken(), userLogin: () => readUserLogin() },
);
```

Каталог — сырые обёртки без типизированной формы ответа: `fetchNeuroboxRecipes`,
`fetchNeuroboxPassports`, `fetchNeuroboxAgents`, `fetchNeuroboxSeeds`, `fetchNeuroboxRefusals`,
`fetchNeuroboxMcpServers` (имена для `forwardedProps` бери отсюда, не вписывай на память), и
`fetchNeuroboxHealth` (единственная без токена):

```ts
import { fetchNeuroboxRecipes, fetchNeuroboxHealth } from "@web-core/neurobox";

const recipes = await fetchNeuroboxRecipes({
  baseUrl: "https://neurobox.example",
  token: () => readBoxToken(),
  userLogin: () => readUserLogin(),
});
const health = await fetchNeuroboxHealth({ baseUrl: "https://neurobox.example" });
```

MCP-клиент (точечный обмен между инстансами зон или с процессом, говорящим MCP по stdio) — та же
форма (`Peer`/`PeerInfo`/`StdioPeerOptions`, те же имена), что `@web-core/mcp/peer`, поверх
`@tanstack/ai-mcp` вместо своей реализации. Node-only (использует `child_process` через SDK):

```ts
import { httpPeer, stdioPeer } from "@web-core/neurobox/mcp";

const zonePeer = httpPeer("http://127.0.0.1:4000/mcp");

await zonePeer.callTool("list_components", { group: "actions" });
await zonePeer.close(); // или: await using zonePeer = httpPeer(...) — closes on scope exit
```

`createBrowser` — та же обёртка над `chrome-devtools-mcp`, что была в `@web-core/mcp/browser`,
поверх `stdioPeer` выше (не голого `npx` руками):

```ts
import { createBrowser } from "@web-core/neurobox/mcp";

const browser = createBrowser({ executablePath: "/path/to/chrome" });
const pageId = await browser.newPage();
await browser.navigate(pageId, "https://example.com");
const shot = await browser.screenshot(pageId);
```

MCP-сервер — построение своих MCP-серверов зон (`apps/skin/.mcp` и подобные), перенос
`@web-core/mcp` (корень + `/transport`) без изменений в логике:

```ts
import { createServer, ok, registerTool } from "@web-core/neurobox/server";
import { z } from "@web-core/io";

const server = createServer({
  name: "skin-mcp",
  version: "0.0.0",
  transport: "http",
  registerTools: (mcp) =>
    registerTool(mcp, {
      name: "list_components",
      description: "перечень компонентов скина",
      access: "read",
      input: z.object({ group: z.string().optional() }),
      handler: ({ group }) => ok({ items: [] }),
    }),
});
await server.listen(4000);
```

Пагинация — курсорная, для листингов MCP-тулов:

```ts
import { paginate, limitSchema } from "@web-core/neurobox/pagination";

const page = paginate(allItems, { limit: 20, cursor: request.cursor });
```

Фидбэк зоны — как сработал ОДИН MCP-тул зоны, не бокс целиком:

```ts
import { reportFeedback } from "@web-core/neurobox/zone-feedback";

await reportFeedback("https://presets.example/graphql", {
  tool: "save_preset",
  action: "click",
  actual: "миганием",
});
```

Механика тулов — трёхслойное деление (меха здесь → пакет знает свой вход/выход → апп-зона решает,
что реально открыть агенту): `toolDefinition()` требует `access`, кладёт его в `metadata`
`@tanstack/ai`'s тула; `accessOf()` читает обратно с любого построенного тула (`.server(...)`/
`.client(...)` тоже несут его):

```ts
import { toolDefinition, accessOf } from "@web-core/neurobox/tool";
import { z } from "@web-core/io";

const savePreset = toolDefinition({
  name: "save_preset",
  description: "сохраняет пресет",
  access: "write",
  inputSchema: z.object({ name: z.string() }),
});

const serverTool = savePreset.server(async ({ name }) => ({ ok: true }));
accessOf(serverTool); // "write"
```

Открытые вопросы (события отказов) — `ROADMAP.yaml`.
