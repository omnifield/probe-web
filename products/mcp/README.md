# @omnifield/probe-web-mcp

Тонкая обвязка поверх официального `@modelcontextprotocol/sdk`: транспорт Streamable HTTP,
регистрация плоского списка инструментов. Про конкретный продукт пакет не знает ничего — это
каркас, которым ЛЮБОЙ продукт на фреймворке подключает агента (`PWEB-117`).

Не про одного конкретного агента: скин-генератор (шаблоны сборок акардиона/кнопки) — свой
отдельный вопрос, `PWEB-115`/`PWEB-116`. Здесь только общий протокол подключения.

## Один вызов

```ts
import { createServer } from "node:http";
import { createMcpServer, defineMcpTool, frameworkTools } from "@omnifield/probe-web-mcp";
import { z } from "zod";

const myOwnTool = defineMcpTool({
  name: "my_product_tool",
  description: "…",
  inputSchema: { id: z.string() },
  handler: ({ id }) => ({ content: [{ type: "text", text: `…${id}` }] }),
});

const listener = createMcpServer({
  name: "my-product",
  tools: [
    ...frameworkTools({ origin: "http://127.0.0.1:8787" }), // фреймворковые — по желанию
    myOwnTool, // свои — конкатенацией, без наследования и переопределения фреймворковых
  ],
});

createServer(listener).listen(3000);
```

`createMcpServer` отдаёт `RequestListener` — продукт сам решает порт, путь и как его
монтировать (в свой уже работающий сервер или отдельным). Пакет процессом не владеет.

Режим — stateless Streamable HTTP: на каждый запрос заводится свой `McpServer` и своя
`StreamableHTTPServerTransport`. Список инструментов фиксирован при вызове `createMcpServer` и
не меняется между запросами — сессию отслеживать нечем.

## Форма инструмента

`defineMcpTool` выводит тип аргументов обработчика из его же `inputSchema` (Zod-схема, как у
`McpServer.registerTool` из SDK — форма не переизобретена). Обработчик отдаёт настоящий
`CallToolResult` протокола, а не собственный конверт.

## Фреймворковый набор

`frameworkTools({ origin })` — паспорт кита + пресеты, одним вызовом:

- `list_components` / `get_component_passport` — интроспекция паспорта кита пробует
  `PASSPORTS`/`passportOf` из `@omnifield/probe-web-ui/passport`. Паспорт — источник правды,
  инструмент его не переизобретает. Форма сборок (`PassportAssembly` из
  `@omnifield/probe-web-skin/editor`) сюда сознательно не включена: сегодня она не приезжает ни
  на одном настоящем компоненте кита (`defineEditorInfo` используется только в фикстурах
  `packages/skin/test/passports.ts`) — конкретные сборки-шаблоны остаются отдельной заявкой
  (`PWEB-115`/`PWEB-116`).
- `list_presets` / `get_preset` — прокси к REST-складу `products/presets` (адрес — параметр
  `origin`, служба не знает своего продукта заранее и наоборот).

Можно включить и по отдельности — `listComponentsTool`, `getComponentPassportTool`,
`presetsTools({ origin })` экспортированы сами по себе.

## Гейт

`test/server.test.ts` поднимает настоящий HTTP-сервер с одним фреймворковым
(`list_components`) и одним фиктивным продуктовым инструментом, подключается настоящим
`Client`/`StreamableHTTPClientTransport` из SDK и реально вызывает `tools/list`/`tools/call` —
без мока протокола.
