import type { Conversation, Part, Participant, TextPart } from "./model";

/** Публичный контракт пакета: чат не хранит беседу сам — `conversation` едет снаружи на каждый
 *  рендер, `onSend` единственный выход. Отдаёт только СОСТАВЛЕННЫЕ локальным участником parts, не
 *  собирает `Message` сам — id/createdAt и попадание в историю решает потребитель, не чат. */
export interface ChatIO<TPart extends Part = TextPart> {
  readonly conversation: Conversation<TPart>;
  readonly viewerId: Participant["id"];
  readonly onSend: (parts: readonly TPart[]) => void;
}
