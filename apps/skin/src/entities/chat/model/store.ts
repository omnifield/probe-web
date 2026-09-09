import { createSignal } from "solid-js";

import { sendChatMessage } from "./api";

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
    const reply = result.refusal ?? result.reply;
    if (reply) appendMessage(AGENT_AUTHOR, reply);
  } catch (error) {
    appendMessage(AGENT_AUTHOR, error instanceof Error ? error.message : String(error));
  } finally {
    setPending(false);
  }
}
