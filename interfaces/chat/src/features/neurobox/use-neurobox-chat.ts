import { createMemo, type Accessor } from "solid-js";
import { useChat } from "@web-core/neurobox/solid";
import type { ConnectConnectionAdapter } from "@web-core/neurobox";

import type { Conversation, Message, Participant, TextPart } from "../../entities/conversation/model";
import { AGENT_PARTICIPANT_ID, mapNeuroboxMessage } from "./map-message";
import { registerNeuroboxParts, type NeuroboxPart } from "./parts";

// Модульный уровень, не лениво: `useNeuroboxChat` — единственный экспорт этого файла, который
// реально используют, значит модуль остаётся в сборке при "sideEffects": false пакета (тот же
// урок, что у `text-part.tsx`/`part-view.tsx` — см. ROADMAP, лог `core-stream-render-built`).
registerNeuroboxParts();

export interface UseNeuroboxChatOptions {
  readonly connection: ConnectConnectionAdapter;
  /** Поток — на сеанс работы, не на сообщение (NEUROBOX_CLIENT.md, «Поток и прогон») — должен
   *  пережить перезагрузку страницы, не генерироваться заново на каждый маунт. */
  readonly threadId: string;
  readonly viewerId: string;
  readonly viewerName?: string;
  readonly agentName?: string;
  readonly forwardedProps?: Record<string, unknown>;
}

export interface NeuroboxChat {
  readonly conversation: Accessor<Conversation<NeuroboxPart>>;
  readonly viewerId: string;
  readonly isStreaming: Accessor<boolean>;
  readonly onSend: (parts: readonly TextPart[]) => void;
  readonly onStop: () => void;
}

/** Мост между `useChat` (`@web-core/neurobox/solid`, словарь AG-UI) и нейтральным ядром чата —
 *  переводит `UIMessage[]` в `Conversation<NeuroboxPart>`, ничего не добавляя от себя: бокс сам
 *  не хранит беседу (`NEUROBOX_CLIENT.md`, «Кто помнит разговор») — история этого прогона целиком
 *  живёт в `useChat`, эта функция только читает её и переводит форму. */
export function useNeuroboxChat(options: UseNeuroboxChatOptions): NeuroboxChat {
  const chat = useChat({
    connection: options.connection,
    threadId: options.threadId,
    forwardedProps: options.forwardedProps,
  });

  const participants = createMemo<readonly Participant[]>(() => [
    { id: options.viewerId, name: options.viewerName ?? "Вы" },
    { id: AGENT_PARTICIPANT_ID, name: options.agentName ?? "Агент" },
  ]);

  const messages = createMemo<readonly Message<NeuroboxPart>[]>(() =>
    chat
      .messages()
      .map((message) => mapNeuroboxMessage(message, options.viewerId))
      .filter((message): message is Message<NeuroboxPart> => message !== undefined),
  );

  const conversation = createMemo<Conversation<NeuroboxPart>>(() => ({
    participants: participants(),
    messages: messages(),
  }));

  function onSend(parts: readonly TextPart[]): void {
    const text = parts.map((part) => part.text).join("");
    if (text.length > 0) void chat.sendMessage(text);
  }

  return {
    conversation,
    viewerId: options.viewerId,
    isStreaming: chat.isLoading,
    onSend,
    onStop: chat.stop,
  };
}
