import { convertMessagesToModelMessages } from "@tanstack/ai-client";
import type { ConnectConnectionAdapter, RunAgentInputContext } from "@tanstack/ai-client";
import { neuroboxUrl, resolveAccessHeaders } from "./access.js";
import type { NeuroboxAccessOptions } from "./access.js";

/** AG-UI `context`-запись — что апп знает о месте (страница/компонент/вариант), не о том, чем думать. */
export interface NeuroboxContextEntry {
  description: string;
  /** Протокол несёт строку (`NEUROBOX_CLIENT.md`'s пример — `"value": "button"`), не что угодно. */
  value: string;
}

/**
 * Своя ручка бокса ("Свои ручки в браузере", `NEUROBOX_CLIENT.md`) — действие, которого на сервере
 * нет (localStorage, состояние экрана). НЕ регистрировать тем же тулом в `useChat({ tools: [...] })`
 * — штатный `ChatClient` пойдёт СВОИМ путём доставки результата (новый `connect()`), а бокс ждёт
 * `POST /agent/{threadId}/tool/{toolCallId}` на ТОМ ЖЕ соединении; `connect()` ниже уже собирает и
 * доставляет результат сам, второй канал доставки только всё сломает (разбор — FAQ.md).
 */
export interface NeuroboxClientTool {
  readonly name: string;
  readonly description: string;
  /** JSON Schema аргументов — уезжает в `tools[]` конверта как есть. */
  readonly parameters: Record<string, unknown>;
  /** Исполняется у потребителя пакета, не на боксе — «бокс здесь почтальон, не исполнитель». */
  readonly execute: (args: unknown) => unknown | Promise<unknown>;
}

export interface NeuroboxConnectionOptions extends NeuroboxAccessOptions {
  /** Адрес бокса. Пусто — запросы идут относительным путём (`/api/agent`). */
  baseUrl?: string;
  fetchClient?: typeof fetch;
  /** Таймаут на сам вызов `/cancel`, мс. По умолчанию 5000. */
  cancelTimeoutMs?: number;
  /** Свои ручки бокса — см. {@link NeuroboxClientTool}. */
  clientTools?: ReadonlyArray<NeuroboxClientTool>;
  /** Таймаут на сам вызов `POST /tool/{toolCallId}`, мс. По умолчанию 5000. */
  toolResultTimeoutMs?: number;
}

const DEFAULT_CANCEL_TIMEOUT_MS = 5000;
const DEFAULT_TOOL_RESULT_TIMEOUT_MS = 5000;

function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/**
 * Забытый `threadId` раньше тихо заводил новый холодный поток на каждый ход — выглядит рабочим, но
 * теряет состояние MCP-зон и путает `/spent` (который считает по потоку). Найдено ревью со стороны
 * бокса: отсутствие `threadId` — ошибка конфигурации потребителя пакета, не штатный случай.
 */
function requireThreadId(runContext: RunAgentInputContext | undefined): string {
  if (runContext?.threadId) return runContext.threadId;
  throw new Error(
    "@web-core/neurobox: threadId не передан. Поток — на сеанс работы, не на сообщение " +
      "(NEUROBOX_CLIENT.md, «Поток и прогон») — без него каждый ход тихо заводит новый холодный " +
      "поток, теряя состояние MCP-зон.",
  );
}

/**
 * Не-текстовые части (картинка, вложение, результат тула) намеренно отбрасываются молча — бокс
 * текстовый, мультимодальность в NEUROBOX_CLIENT.md не описана и не читает их. Если это когда-нибудь
 * изменится, здесь нужно решать заново, не расширять склейку тихо.
 */
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
  clientTools: ReadonlyArray<NeuroboxClientTool>,
) {
  const merged: Record<string, unknown> = { ...runContext?.forwardedProps, ...data };
  const { context, ...forwardedProps } = merged;
  return {
    threadId: requireThreadId(runContext),
    runId: runContext?.runId ?? generateId("run"),
    messages: convertMessagesToModelMessages(messages).map((message) => ({
      id: message.id ?? generateId("msg"),
      role: message.role,
      content: toWireContent(message.content),
    })),
    // НЕ runContext?.clientTools: штатный TanStack-канал доставки результата (addToolResult() →
    // новый connect()) не совпадает с протоколом бокса — см. NeuroboxClientTool и FAQ.md.
    tools: clientTools.map(({ name, description, parameters }) => ({ name, description, parameters })),
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

/** Что вернул `execute()` своей ручки, в форме, которую ждёт `POST /tool/{toolCallId}`. */
async function runClientTool(tool: NeuroboxClientTool, argsJson: string): Promise<{ content: string; failed: boolean }> {
  try {
    const args: unknown = argsJson.length > 0 ? JSON.parse(argsJson) : {};
    const result = await tool.execute(args);
    return { content: typeof result === "string" ? result : JSON.stringify(result), failed: false };
  } catch (error) {
    // failed: true — «агент скажет человеку, что действие не сделано, а не соврёт об успехе»
    // (NEUROBOX_CLIENT.md). Ошибка в execute() — не повод ронять весь connect(), только этот вызов.
    return { content: error instanceof Error ? error.message : String(error), failed: true };
  }
}

/**
 * Своя ручка бокса замирает поток до этого запроса (`NEUROBOX_CLIENT.md`: «поток замирает…
 * оживает на том же соединении») — свой `AbortController`/таймаут, та же ловушка и то же решение,
 * что у `sendCancel`: входной `abortSignal` уже мог сработать к этому моменту, реюзать нельзя.
 * В отличие от `sendCancel` — ошибку НЕ глотает: недоставленный результат оставляет бокс ждать до
 * `tool-abandoned`, это стоит того, чтобы `connect()` завершился с ошибкой, а не тихо.
 */
async function postClientToolResult(
  fetchClient: typeof fetch,
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  content: string,
  failed: boolean,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetchClient(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ content, failed }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Ловит `TOOL_CALL_START`/`ARGS`/`END` для тулов из своего списка (по имени), копит аргументы,
 * на `END` доставляет результат и ждёт этого ПЕРЕД тем, как читать дальше — поток всё равно
 * заморожен на стороне бокса до доставки, ждать нечего вперёд. Кадры проходят наружу как есть —
 * потребитель `onChunk` видит ту же активность, что и по любому другому тулу.
 */
async function* deliverClientToolResults<TChunk>(
  chunks: AsyncGenerator<TChunk, void, unknown>,
  clientTools: ReadonlyMap<string, NeuroboxClientTool>,
  deliver: (toolCallId: string, tool: NeuroboxClientTool, argsJson: string) => Promise<void>,
): AsyncGenerator<TChunk, void, unknown> {
  const pending = new Map<string, { tool: NeuroboxClientTool; args: string }>();
  for await (const chunk of chunks) {
    yield chunk;
    if (clientTools.size === 0 || !isRecord(chunk)) continue;
    const toolCallId = chunk["toolCallId"];
    if (typeof toolCallId !== "string") continue;

    if (chunk["type"] === "TOOL_CALL_START") {
      const toolCallName = chunk["toolCallName"];
      const tool = typeof toolCallName === "string" ? clientTools.get(toolCallName) : undefined;
      if (tool) pending.set(toolCallId, { tool, args: "" });
      continue;
    }
    if (chunk["type"] === "TOOL_CALL_ARGS") {
      const entry = pending.get(toolCallId);
      const delta = chunk["delta"];
      if (entry && typeof delta === "string") entry.args += delta;
      continue;
    }
    if (chunk["type"] === "TOOL_CALL_END") {
      const entry = pending.get(toolCallId);
      if (entry) {
        pending.delete(toolCallId);
        await deliver(toolCallId, entry.tool, entry.args);
      }
    }
  }
}

/**
 * Свой `ConnectConnectionAdapter` для бокса нейробокс. Штатный `fetchServerSentEvents` из
 * `@tanstack/ai-client` шлёт AG-UI `context` жёстко пустым массивом и не знает про отдельный
 * запрос отмены бокса — разбор обоих фактов чтением исходников вендора см. `FAQ.md`.
 */
export function createNeuroboxConnection(options: NeuroboxConnectionOptions): ConnectConnectionAdapter {
  const fetchClient = options.fetchClient ?? fetch;
  const baseUrl = options.baseUrl;
  const cancelTimeoutMs = options.cancelTimeoutMs ?? DEFAULT_CANCEL_TIMEOUT_MS;
  const toolResultTimeoutMs = options.toolResultTimeoutMs ?? DEFAULT_TOOL_RESULT_TIMEOUT_MS;
  const clientTools = options.clientTools ?? [];
  const clientToolsByName = new Map(clientTools.map((tool) => [tool.name, tool]));

  return {
    async *connect(messages, data, abortSignal, runContext) {
      const headers = await resolveAccessHeaders(options);
      const body = buildNeuroboxRunInput(messages, data, runContext, clientTools);
      const cancelUrl = neuroboxUrl(baseUrl, "api", "agent", body.threadId, "cancel");

      const onAbort = () => {
        void sendCancel(fetchClient, cancelUrl, headers, cancelTimeoutMs);
      };
      abortSignal?.addEventListener("abort", onAbort, { once: true });

      try {
        const response = await fetchClient(neuroboxUrl(baseUrl, "api", "agent"), {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
          signal: abortSignal,
        });
        if (!response.ok) {
          throw new Error(`Нейробокс отказал в прогоне: ${response.status} ${response.statusText}`);
        }

        const deliver = async (toolCallId: string, tool: NeuroboxClientTool, argsJson: string): Promise<void> => {
          const { content, failed } = await runClientTool(tool, argsJson);
          const toolUrl = neuroboxUrl(baseUrl, "api", "agent", body.threadId, "tool", toolCallId);
          await postClientToolResult(fetchClient, toolUrl, headers, toolResultTimeoutMs, content, failed);
        };

        yield* deliverClientToolResults(
          parseNeuroboxEventStream(response, abortSignal),
          clientToolsByName,
          deliver,
        );
      } finally {
        abortSignal?.removeEventListener("abort", onAbort);
      }
    },
  };
}
