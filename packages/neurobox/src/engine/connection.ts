import { convertMessagesToModelMessages } from "@tanstack/ai-client";
import type { ConnectConnectionAdapter, RunAgentInputContext } from "@tanstack/ai-client";

/** AG-UI `context`-запись — что апп знает о месте (страница/компонент/вариант), не о том, чем думать. */
export interface NeuroboxContextEntry {
  description: string;
  value: unknown;
}

/** Значение заголовка доступа: постоянная строка либо геттер, если оно вычисляется на месте отправки. */
export type NeuroboxAccessValue = string | (() => string | Promise<string>);

export interface NeuroboxConnectionOptions {
  /** Адрес бокса. Пусто — запросы идут относительным путём (`/api/agent`). */
  baseUrl?: string;
  /** `Authorization: Bearer <token>` — общий токен на приложение, не на человека. */
  token: NeuroboxAccessValue;
  /** `X-User-Login` — логин, которым приложение представляется. Только латиница (см. NEUROBOX_CLIENT.md). */
  userLogin: NeuroboxAccessValue;
  fetchClient?: typeof fetch;
  /** Таймаут на сам вызов `/cancel`, мс. По умолчанию 5000. */
  cancelTimeoutMs?: number;
}

const DEFAULT_CANCEL_TIMEOUT_MS = 5000;

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function resolveAccessValue(value: NeuroboxAccessValue): Promise<string> {
  return typeof value === "function" ? await value() : value;
}

async function resolveAccessHeaders(options: NeuroboxConnectionOptions): Promise<Record<string, string>> {
  const [token, userLogin] = await Promise.all([
    resolveAccessValue(options.token),
    resolveAccessValue(options.userLogin),
  ]);
  return { Authorization: `Bearer ${token}`, "X-User-Login": userLogin };
}

function toWireContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : "",
      )
      .join("");
  }
  return "";
}

function buildNeuroboxRunInput(
  messages: Parameters<ConnectConnectionAdapter["connect"]>[0],
  data: Record<string, unknown> | undefined,
  runContext: RunAgentInputContext | undefined,
) {
  const merged: Record<string, unknown> = { ...runContext?.forwardedProps, ...data };
  const { context, ...forwardedProps } = merged;
  return {
    threadId: runContext?.threadId ?? generateId("thread"),
    runId: runContext?.runId ?? generateId("run"),
    messages: convertMessagesToModelMessages(messages).map((message) => ({
      id: message.id ?? generateId("msg"),
      role: message.role,
      content: toWireContent(message.content),
    })),
    tools: runContext?.clientTools ?? [],
    state: {},
    context: Array.isArray(context) ? (context as Array<NeuroboxContextEntry>) : [],
    forwardedProps,
  };
}

async function* parseNeuroboxEventStream(response: Response, abortSignal?: AbortSignal) {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (!abortSignal?.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const rawLine of lines) {
        const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trimStart();
        if (data.length > 0) yield JSON.parse(data);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Отправка отмены НЕ переиспользует abortSignal, который её вызвал — сработавший сигнал оборвал бы
 * и сам запрос отмены, не дав ему дойти до бокса (ловушка найдена внешним ревью, см. FAQ.md).
 */
async function sendCancel(
  fetchClient: typeof fetch,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetchClient(url, { method: "POST", headers, signal: controller.signal });
  } catch {
    // fire-and-forget по срабатыванию abort — вызывать в ответ на исход нечего, обрыв уже случился
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Свой `ConnectConnectionAdapter` для бокса нейробокс. Штатный `fetchServerSentEvents` из
 * `@tanstack/ai-client` шлёт AG-UI `context` жёстко пустым массивом и не знает про отдельный
 * запрос отмены бокса — разбор обоих фактов чтением исходников вендора см. `FAQ.md`.
 */
export function createNeuroboxConnection(options: NeuroboxConnectionOptions): ConnectConnectionAdapter {
  const fetchClient = options.fetchClient ?? fetch;
  const baseUrl = options.baseUrl ?? "";
  const cancelTimeoutMs = options.cancelTimeoutMs ?? DEFAULT_CANCEL_TIMEOUT_MS;

  return {
    async *connect(messages, data, abortSignal, runContext) {
      const headers = await resolveAccessHeaders(options);
      const body = buildNeuroboxRunInput(messages, data, runContext);
      const cancelUrl = `${baseUrl}/api/agent/${body.threadId}/cancel`;

      const onAbort = () => {
        void sendCancel(fetchClient, cancelUrl, headers, cancelTimeoutMs);
      };
      abortSignal?.addEventListener("abort", onAbort, { once: true });

      try {
        const response = await fetchClient(`${baseUrl}/api/agent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
          signal: abortSignal,
        });
        if (!response.ok) {
          throw new Error(`Нейробокс отказал в прогоне: ${response.status} ${response.statusText}`);
        }
        yield* parseNeuroboxEventStream(response, abortSignal);
      } finally {
        abortSignal?.removeEventListener("abort", onAbort);
      }
    },
  };
}
