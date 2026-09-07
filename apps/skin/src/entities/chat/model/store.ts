import { createSignal } from "solid-js";

export interface ChatMessage {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  readonly timestamp: string;
}

// Мок — куда сообщения реально полетят (и откуда возьмётся история), скажут позже.
const MOCK_MESSAGES: readonly ChatMessage[] = [
  {
    id: "1",
    author: "Ева",
    text: "Привет! Как продвигается скин кнопки?",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    author: "Архитектор",
    text: "Почти готово, тестирую карусель.",
    timestamp: new Date().toISOString(),
  },
  {
    id: "3",
    author: "Ева",
    text: "Огонь, погнали дальше.",
    timestamp: new Date().toISOString(),
  },
];

export const [messages, setMessages] = createSignal<readonly ChatMessage[]>(MOCK_MESSAGES);

/** Пока просто дописывает в локальный список — куда реально улетит, скажут позже. */
export function sendMessage(author: string, text: string): void {
  setMessages((current) => [
    ...current,
    { id: crypto.randomUUID(), author, text, timestamp: new Date().toISOString() },
  ]);
}
