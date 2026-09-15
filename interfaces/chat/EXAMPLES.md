# 🧪 Примеры — как работать с `@web-core/chat`

Рабочий код для локального теста, не канон. Архитектура и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

## 1. Локальный чат без бэкенда

Самый быстрый способ увидеть `Transcript`+`Composer` живьём — свой стейт, без сети:

```tsx
import { createSignal } from "solid-js";
import {
  Transcript,
  Composer,
  type Message,
  type TextPart,
} from "@web-core/chat";

const VIEWER_ID = "me";

export function LocalChatDemo() {
  const [messages, setMessages] = createSignal<Message<TextPart>[]>([]);

  function onSend(parts: readonly TextPart[]) {
    const text = parts.map((p) => p.text).join("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        participantId: VIEWER_ID,
        parts: [{ type: "text", text }],
        createdAt: Date.now(),
      },
    ]);
  }

  return (
    <>
      <Transcript messages={messages()} />
      <Composer onSend={onSend} />
    </>
  );
}
```

Своих сообщений без ответа хватит проверить композер (многострочность, Enter/Shift+Enter) и рендер
`text`-части. Для скролла нужен второй участник — ниже.

## 2. Эхо-бот (второй участник, без сети)

Тот же пример, плюс отложенный ответ от `participantId: "echo"` — удобно проверить
stick-to-bottom-скролл (`Transcript`): при быстрых ответах список должен сам ехать вниз, пока не
прокрутил историю вверх — тогда должна появиться кнопка «новые сообщения ↓».

```tsx
function onSend(parts: readonly TextPart[]) {
  const text = parts.map((p) => p.text).join("");
  const mine: Message<TextPart> = {
    id: crypto.randomUUID(),
    participantId: VIEWER_ID,
    parts: [{ type: "text", text }],
    createdAt: Date.now(),
  };
  setMessages((prev) => [...prev, mine]);

  setTimeout(() => {
    const reply: Message<TextPart> = {
      id: crypto.randomUUID(),
      participantId: "echo",
      parts: [{ type: "text", text: `эхо: ${text}` }],
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, reply]);
  }, 400);
}
```

## 3. Чат с агентом (neurobox)

Реальный прогон через бокс — нужен живой `baseUrl` (и токен/логин, если бокс их требует —
`createNeuroboxConnection`'s опции, см. `NEUROBOX_CLIENT.md`, раздел «Доступ»):

```tsx
import { Transcript, Composer } from "@web-core/chat";
import { useNeuroboxChat } from "@web-core/chat/neurobox";
import { createNeuroboxConnection } from "@web-core/neurobox";

const connection = createNeuroboxConnection({
  baseUrl: "https://neurobox.example",
});

export function AgentChatDemo() {
  const chat = useNeuroboxChat({
    connection,
    threadId: "тест-чата-1", // держи одно и то же имя между перезагрузками, пока тестируешь
    viewerId: "me",
  });

  return (
    <>
      <Transcript messages={chat.conversation().messages} />
      <Composer
        onSend={chat.onSend}
        isStreaming={chat.isStreaming()}
        onStop={chat.onStop}
      />
    </>
  );
}
```

Полезно проверить: кнопка композера меняется на «стоп», пока агент отвечает; тулз-коллы рисуются
`ToolCallPart`/`ToolResultPart` (регистрируются сами, ничего звать не нужно); поток «замирает» на
своих ручках (`NEUROBOX_CLIENT.md`, «Свои ручки в браузере») — сюда пока не подключено, только
серверные ручки рецепта.

## 4. Своя фича — новый тип part

Как добавить рендер для нового типа part'а, не трогая ядро (та же механика, что несут
`thinking`/`tool-call`/`tool-result` у агентской фичи) — например реакция на сообщение:

```tsx
import { registerPart, type Part } from "@web-core/chat";

interface ReactionPart extends Part {
  type: "reaction";
  emoji: string;
}

registerPart<ReactionPart>("reaction", (props) => (
  <span>{props.part.emoji}</span>
));
```

Дальше просто кладёшь `{ type: "reaction", emoji: "🔥" }` в `parts` сообщения — `PartView` (его
зовёт `Transcript` на каждую часть) найдёт рендер сама по `part.type`, править `Transcript`/ядро не
нужно.

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница, оба плейсхолдера сейчас закомментированы:

```tsx
import { LocalChatDemo } from "..."; // любой пример выше

export function LabPage() {
  return <LocalChatDemo />;
}
```
