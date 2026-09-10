import { createSignal } from "solid-js";

import { queryClient } from "#/shared/api/query-client";

import { sendChatMessage, type ChatToolCall } from "./api";

export interface ChatMessage {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly timestamp: string;
}

const AGENT_AUTHOR = "Агент";

export const [messages, setMessages] = createSignal<readonly ChatMessage[]>([]);
/** Ждём ли ответ агента — сессия per-компонент синхронная, второе сообщение до ответа на первое
 *  не имеет смысла (`ChatControl` дизейблит форму по этому флагу). */
export const [pending, setPending] = createSignal(false);

function appendMessage(author: string, text: string): void {
  setMessages((current) => [
    ...current,
    { id: crypto.randomUUID(), author, text, timestamp: new Date().toISOString() },
  ]);
}

/** Перезапрашивает данные, задетые вызовами MCP-тулов за этот прогон — витрина сама подхватывает
 *  правку агента, не только показывает ответ в чате. `save_content` бьёт по общему списку content
 *  целиком (`listContentFor` фильтрует его на клиенте, ключа per-компонент нет — лишний
 *  перезапрос дешевле пропущенного); `save_preset` — по `arguments.kind`, сегодня no-op (кэша под
 *  form/outfit/palette/assembly в этом приложении ещё нет), задел под конвенцию ключей на будущее
 *  для `componentInfo`. */
function invalidateFor(did: readonly ChatToolCall[]): void {
  for (const call of did) {
    if (call.tool === "save_content") {
      void queryClient.invalidateQueries({ queryKey: ["content"] });
    } else if (call.tool === "save_preset") {
      const kind = (call.arguments as { kind?: unknown } | undefined)?.kind;
      if (typeof kind === "string") void queryClient.invalidateQueries({ queryKey: [kind] });
    }
  }
}

/**
 * Дописывает сообщение юзера сразу (оптимистично), затем ждёт ответ агента (`sendChatMessage`,
 * `run-finished`) и дописывает его следом. `refusal` — тоже полноценный ответ агента, просто
 * отрицательный, показывается тем же путём, что `reply`. Сетевая ошибка/отказ службы — тоже
 * оседает в чат, а не проглатывается молча.
 */
export async function sendMessage(author: string, text: string): Promise<void> {
  appendMessage(author, text);
  setPending(true);
  try {
    const result = await sendChatMessage(text);
    invalidateFor(result.did);
    const reply = result.refusal ?? result.reply;
    if (reply) appendMessage(AGENT_AUTHOR, reply);
  } catch (error) {
    appendMessage(AGENT_AUTHOR, error instanceof Error ? error.message : String(error));
  } finally {
    setPending(false);
  }
}
