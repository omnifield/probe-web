import { createSignal } from "solid-js";
import { Transcript, Composer, type Message, type TextPart } from "@web-core/chat";

const VIEWER_ID = "viewer";

// Локальный стейт вместо бэкенда — `@web-core/chat` историю не хранит сам (README, «Историю чат не
// хранит»), а агентский адаптер (`@web-core/chat/neurobox`) требует подключения, которого у
// skin-app пока нет. Это тестовая проводка ядра, не готовый продуктовый чат.
export function Chat() {
  const [messages, setMessages] = createSignal<Message<TextPart>[]>([]);

  function onSend(parts: readonly TextPart[]) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), participantId: VIEWER_ID, parts, createdAt: Date.now() },
    ]);
  }

  return (
    <>
      <Transcript messages={messages()} />
      <Composer onSend={onSend} />
    </>
  );
}
