import { currentComponent } from "#/entities/component";
import { currentUser } from "#/entities/user";

// Тот же приём, что у PRESETS_URL (`entities/component/model/content.ts`) — билд-тайм env, свой
// адрес у каждого продукта. Токен — общий для всех юзеров витрины (`X-User-Login` несёт личность
// поверх него), поэтому он тоже билд-тайм, не за юзером.
const CHAT_URL = (import.meta.env["VITE_CHAT_URL"] as string | undefined) ?? "https://150.251.145.87/api";
const CHAT_TOKEN = import.meta.env["VITE_CHAT_TOKEN"] as string | undefined;

export interface ChatToolCall {
  readonly server: string;
  readonly tool: string;
  readonly arguments: unknown;
}

export interface ChatRunResult {
  readonly event: string;
  readonly run: string;
  readonly state: string;
  readonly reply: string | null;
  readonly refusal: string | null;
  readonly did: readonly ChatToolCall[];
}

/**
 * Шлёт сообщение в чат-сессию агента и ждёт синхронный ответ (`run-finished`) — без стриминга,
 * без поллинга, один POST — один JSON обратно.
 *
 * Session id = имя ТЕКУЩЕГО компонента (`currentComponent`, `entities/component`) — агент сам
 * хранит историю per-session на своей стороне, фронту достаточно назвать компонент. Компонент не
 * выбран — отправлять некуда, явный отказ, а не запрос в никуда.
 */
export async function sendChatMessage(text: string): Promise<ChatRunResult> {
  const component = currentComponent();
  if (!component) throw new Error("нет выбранного компонента — не из чего собрать session id чата");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CHAT_TOKEN) headers["Authorization"] = `Bearer ${CHAT_TOKEN}`;
  const login = currentUser();
  if (login) headers["X-User-Login"] = login;

  const response = await fetch(`${CHAT_URL}/sessions/${component}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, context: { component } }),
  });

  if (!response.ok) throw new Error(`чат отказал: ${response.status} ${response.statusText}`);

  return (await response.json()) as ChatRunResult;
}
