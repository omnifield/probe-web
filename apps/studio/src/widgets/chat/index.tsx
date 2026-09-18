import { Composer, Transcript } from "@web-core/chat";
import { useNeuroboxChat } from "@web-core/chat/neurobox";
import { NEUROBOX_USER, neuroboxConnection } from "#/shared/api/clients";

const VIEWER_ID = "viewer";
const THREAD_STORAGE_KEY = "studio-chat-thread-id";

// Поток — на сеанс работы, не на сообщение (NEUROBOX_CLIENT.md, «Поток и прогон»): забыть
// `threadId` — тихо заводить новый холодный поток на каждый ход. `localStorage` переживает
// перезагрузку страницы, генерируется один раз при первом визите.
function readThreadId(): string {
  const stored = localStorage.getItem(THREAD_STORAGE_KEY);
  if (stored !== null) return stored;

  const generated = crypto.randomUUID();
  localStorage.setItem(THREAD_STORAGE_KEY, generated);
  return generated;
}

// Мод работы с агентом: бокс сам переписку не хранит (README/`NEUROBOX_CLIENT.md`, «Кто помнит
// разговор») — `useNeuroboxChat` читает историю ЭТОГО прогона из `useChat` и переводит её в
// нейтральные `parts` ядра, ничего своего не добавляя.
export function Chat() {
  const chat = useNeuroboxChat({
    connection: neuroboxConnection,
    threadId: readThreadId(),
    viewerId: VIEWER_ID,
    viewerName: NEUROBOX_USER,
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
