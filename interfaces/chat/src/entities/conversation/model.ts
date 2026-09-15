export interface Participant {
  readonly id: string;
  readonly name: string;
}

/** Часть сообщения. Ядро знает только `text` (единственное, что есть у любого чата всегда) —
 *  остальные типы (`tool-call`, `attachment` и т.п.) регистрирует фича через открытую точку
 *  расширения, не трогая эту форму. `type: string`, не литерал — иначе фиче некуда было бы
 *  расширяться без правки этого файла. */
export interface Part {
  readonly type: string;
}

export interface TextPart extends Part {
  readonly type: "text";
  readonly text: string;
}

export interface Message<TPart extends Part = TextPart> {
  readonly id: string;
  readonly participantId: Participant["id"];
  readonly parts: readonly TPart[];
  readonly createdAt: number;
}

export interface Conversation<TPart extends Part = TextPart> {
  readonly participants: readonly Participant[];
  readonly messages: readonly Message<TPart>[];
}
