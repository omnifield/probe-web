import type { UIMessage } from "@web-core/neurobox";

import type { Message } from "../../entities/conversation/model";
import type { NeuroboxPart } from "./parts";

export const AGENT_PARTICIPANT_ID = "agent";

/** Бокс текстовый (`NEUROBOX_CLIENT.md`) — `tool-result.content` в форме массива на практике не
 *  встречается, но тип вендора это допускает. Тот же приём защиты, что `toWireContent` в
 *  `packages/neurobox/src/engine/connection.ts` на исходящей стороне. */
function contentText(content: string | ReadonlyArray<unknown>): string {
  if (typeof content === "string") return content;
  return content
    .map((item) => (item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string" ? (item as { text: string }).text : ""))
    .join("");
}

function mapPart(part: UIMessage["parts"][number]): NeuroboxPart | undefined {
  switch (part.type) {
    case "text":
      return { type: "text", text: part.content };
    case "thinking":
      return { type: "thinking", text: part.content };
    case "tool-call":
      return { type: "tool-call", id: part.id, name: part.name, arguments: part.arguments, state: part.state };
    case "tool-result":
      return {
        type: "tool-result",
        toolCallId: part.toolCallId,
        content: contentText(part.content),
        state: part.state,
        error: part.error,
      };
    default:
      // Картинка/аудио/видео/документ/structured-output/UI-ресурс — бокс их не шлёт (текстовый
      // протокол), молча отбрасываем, не падаем на незнакомом типе part'а.
      return undefined;
  }
}

/** `system`-сообщения (системный промпт рантайма) не для показа человеку — фильтруются целиком,
 *  не долетают до ядра как пустой `Message`. */
export function mapNeuroboxMessage(message: UIMessage, viewerId: string): Message<NeuroboxPart> | undefined {
  if (message.role === "system") return undefined;

  return {
    id: message.id,
    participantId: message.role === "user" ? viewerId : AGENT_PARTICIPANT_ID,
    parts: message.parts.map(mapPart).filter((part): part is NeuroboxPart => part !== undefined),
    createdAt: message.createdAt?.getTime() ?? Date.now(),
  };
}
