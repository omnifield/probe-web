import type { ToolCallState, ToolResultState } from "@web-core/neurobox";

import { registerPart } from "../../entities/conversation/part-registry";
import type { Part, TextPart } from "../../entities/conversation/model";

export interface ThinkingPart extends Part {
  readonly type: "thinking";
  readonly text: string;
}

export interface ToolCallPart extends Part {
  readonly type: "tool-call";
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
  readonly state: ToolCallState;
}

export interface ToolResultPart extends Part {
  readonly type: "tool-result";
  readonly toolCallId: string;
  readonly content: string;
  readonly state: ToolResultState;
  readonly error?: string;
}

/** `text` — тот же тип, что у ядра (`entities/conversation/model.ts`), не копия: TanStack шлёт
 *  `{ type: "text", content }`, ядро ждёт `{ type: "text", text }` — перевод поля живёт в
 *  `map-message.ts`, форма самого part'а не дублируется. */
export type NeuroboxPart = TextPart | ThinkingPart | ToolCallPart | ToolResultPart;

function ThinkingPartView(props: { readonly part: ThinkingPart }) {
  return <p style={{ opacity: "0.6", "font-style": "italic" }}>{props.part.text}</p>;
}

function ToolCallPartView(props: { readonly part: ToolCallPart }) {
  return (
    <code>
      → {props.part.name}({props.part.arguments})
    </code>
  );
}

function ToolResultPartView(props: { readonly part: ToolResultPart }) {
  return (
    <code style={{ color: props.part.state === "error" ? "crimson" : undefined }}>
      ← {props.part.error ?? props.part.content}
    </code>
  );
}

/** Регистрирует три новых типа part через `core-parts-extension-point` — ядро не правится, ровно
 *  тот же механизм, что нашёл бы себе внешний фиче-автор. */
export function registerNeuroboxParts(): void {
  registerPart<ThinkingPart>("thinking", ThinkingPartView);
  registerPart<ToolCallPart>("tool-call", ToolCallPartView);
  registerPart<ToolResultPart>("tool-result", ToolResultPartView);
}
