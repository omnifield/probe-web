# ❓ FAQ

Короткие ответы на конкретные вопросы, которые уже возникали по этому пакету. Не общая
документация (она в [`README.md`](./README.md)) и не план (он в [`ROADMAP.yaml`](./ROADMAP.yaml))
— только факты, каждый проверен либо чтением исходников, либо прямым прогоном.

Пакет только что заведён — вопросов, разобранных прогоном, пока не было.

---

## Выбор движка

### Почему `@tanstack/ai-client`/`@tanstack/ai-solid`, не свой клиент под AG-UI?

**Коротко: AG-UI — открытый протокол, TanStack AI полностью совместим с ним в обе стороны
(проверено 2026-09-13 по официальной доке — `@tanstack/ai-client` шлёт настоящий `RunAgentInput`,
не свой формат), уже в семье вендоров (рядом router/query), даёт готовые Solid-хуки
(`useChat`) и адаптеры соединения (`fetchServerSentEvents`) поверх ЛЮБОГО AG-UI-совместимого
бэкенда, не только своего собственного серверного пакета.**

Бокс (см. корневой `NEUROBOX_CLIENT.md`) сам объявляет протокол общения открытым и AG-UI —
«свой формат был и выброшен». Изобретать свой клиент под уже стандартизированный протокол, когда
готовый есть — тот же довод, что уже применялся к `@web-core/form`'s разбору JsonLogic: рынок
уже решил эту задачу.

---

## Connection-адаптер

### Почему нельзя просто взять `fetchServerSentEvents` из `@tanstack/ai-client` как есть?

**Коротко: он шлёт AG-UI поле `context` ЖЁСТКО пустым массивом — физически не может передать то,
что бокс требует отдельно от `forwardedProps`.**

Проверено чтением исходника (не доки) — `dist/esm/connection-adapters.js`,
`@tanstack/ai-client@0.31.1`, функция `buildRunAgentInputBody()`:

```js
function buildRunAgentInputBody(messages, data, runContext, options) {
  const forwardedProps = { ...options.body, ...runContext?.forwardedProps ?? {}, ...data };
  return {
    threadId: runContext?.threadId ?? generateRunId("thread"),
    runId: runContext?.runId ?? generateRunId("run"),
    state: {},
    messages: wireMessages,
    tools: runContext?.clientTools ?? [],
    context: [],              // ← зашито, не параметр
    forwardedProps,
    data: { ...forwardedProps },
  };
}
```

`data` (второй аргумент `sendMessage`) и `options.body` (статичный/динамический `body` у
`fetchServerSentEvents`) уходят ОБА только в `forwardedProps` — в `context` не попадает ничего,
чем бы вы ни звали. А `NEUROBOX_CLIENT.md`, раздел «Прогон», прямо разводит эти два поля по
смыслу: `forwardedProps` — «чем думать» (recipe/passport/agent, статичная конфигурация хода),
`context` — «что апп знает о месте» (компонент/страница/вариант, per-сообщение данные), и
предупреждает не склеивать их с репликой именно потому что это разные вещи. Раз штатный адаптер
не даёт третьего слота — пакет пишет свой `ConnectConnectionAdapter`
(`connect(messages, data, abortSignal, runContext) => AsyncIterable<StreamChunk>`, тип уже
экспортирован пакетом), который сам собирает тело запроса и кладёт `context` из `data` в нужное
место. Сборку `messages` в wire-формат переизобретать не нужно — `convertMessagesToModelMessages`/
`normalizeToUIMessage`/`modelMessagesToUIMessages` уже публичный реэкспорт (`@tanstack/ai/client`
внутри `@tanstack/ai-client`'s `index.d.ts`), приватный `uiMessagesToWire` дублировать незачем.

### Как узнать, что агент сохранил данные, не дожидаясь конца прогона?

**`ChatClientOptions.onChunk` — зовётся на каждый кадр потока, включая `TOOL_CALL_RESULT`, без
своей обвязки поверх connection-адаптера.**

Проверено чтением `types.d.ts`: `onChunk?: (chunk: StreamChunk) => void` — опция самого
`useChat`/`ChatClient`, не адаптера. `StreamChunk` несёт вариант `ToolCallResultEvent`
(`type: 'TOOL_CALL_RESULT'`, поля `toolCallId`/`content`, расширяет `AGUIToolCallResultEvent` —
то же, что и в живом примере потока `NEUROBOX_CLIENT.md`). Значит «агент сохранил — перезапроси и
переключи показ» — это фильтр `chunk.type === 'TOOL_CALL_RESULT'` внутри `onChunk`, передаваемого
как обычная опция потребителем пакета, не отдельный механизм, который нужно строить здесь.

### Как отменить прогон, чтобы бокс не остался «думать» после разрыва?

**Свой `connect()` подписывается на переданный ему `abortSignal` и сам шлёт `POST
/api/agent/{threadId}/cancel` — потребитель зовёт только штатный `stop()`.**

`stop()` из `useChat` рвёт локальный `fetch` через `AbortSignal` — бокс об этом не узнаёт, у него
отмена прогона это ОТДЕЛЬНЫЙ запрос (`NEUROBOX_CLIENT.md`, раздел «Отмена»), не поле конверта и не
следствие обрыва соединения. Решение (не два варианта, один выбран прямо): дожимать `/cancel`
ВНУТРИ пакета, на срабатывание того же `abortSignal`, который и так приходит в `connect()` — а не
заводить отдельную функцию `cancel(threadId)`, которую потребитель обязан не забыть вызвать рядом
со `stop()`. Известный баг бокса («после отмены поток может замолчать, следующее сообщение висит
до `agent-silent`») этим не лечится — это баг бокса, не пакета — но раз он документирован,
поверхность пакета должна явно называть сценарий «после отмены — новый поток», а не оставлять
потребителя удивляться молча.

⚠️ **Ловушка, которую легко не заметить:** `POST /cancel` нельзя слать с ТЕМ ЖЕ `abortSignal`,
который только что сработал — он оборвёт и сам запрос отмены раньше, чем тот дойдёт до бокса
(найдено ревью со стороны бокса, не самостоятельно). Нужен отдельный сигнал/`AbortController` на
сам вызов `/cancel`, не переиспользование входного.
