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

Открытые вопросы (типизация `/feedback`, каталожные ручки, события отказов) — `ROADMAP.yaml`.
