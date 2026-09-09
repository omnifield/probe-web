import { currentComponent } from "#/entities/component";
import { currentSession, currentUser, renewSession } from "#/entities/user";
import { BoxHttpError, boxJson, boxRequest } from "#/shared/api/box";

/** Потолок ожидания одного прогона. Агент думает от 20 секунд до минут — ждать надо долго, но не
 *  вечно: без потолка оборванный на той стороне прогон держал бы форму задизейбленной навсегда. */
const RUN_TIMEOUT_MS = 10 * 60 * 1000;
/** Шаг дочитывания без потока (`/runs`) — прогон живёт минутами, чаще спрашивать незачем. */
const POLL_INTERVAL_MS = 3000;

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
  /** Чем агент подтверждает отказ — приходит рядом с `refusal`, у успешного прогона `null`. */
  readonly means: string | null;
  /** Вызовы ручек, которые НАБЛЮДАЛ бокс, а не пересказ агента. Крупные аргументы бокс подменяет
   *  пометкой, поэтому тип аргументов — `unknown`, а не разобранная форма. */
  readonly did: readonly ChatToolCall[];
}

/** Поток кончился раньше, чем пришёл наш `run-finished`. Не отказ прогона: прогон от обрыва не
 *  останавливается, дочитывать его надо без потока. */
class StreamEndedError extends Error {}

/** Список из ответа: бокс отдаёт либо голым массивом, либо под ключом — читаем оба, чтобы форма
 *  ответа не роняла дочитывание. */
function listOf<T>(payload: unknown, key: string): readonly T[] {
  if (Array.isArray(payload)) return payload as readonly T[];
  const nested = (payload as Record<string, unknown> | null)?.[key];
  return Array.isArray(nested) ? (nested as readonly T[]) : [];
}

/**
 * Кладёт сообщение в сессию. Ответ — 202 и КВИТАНЦИЯ, а не ответ агента: в теле только `run`,
 * по которому ответ забирается потоком. `context` бокс не разбирает и передаёт агенту как данные —
 * им и едет имя компонента, про который идёт разговор.
 */
async function postMessage(
  login: string,
  sessionId: string,
  text: string,
  component: string,
): Promise<string> {
  const receipt = await boxJson<{ run: { id: string } }>(`/sessions/${sessionId}/messages`, login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context: { component } }),
  });
  return receipt.run.id;
}

function openEvents(login: string, sessionId: string, signal: AbortSignal): Promise<Response> {
  // SSE, но с заголовками — браузерный EventSource их не умеет, поэтому обычный fetch с чтением
  // тела потоком.
  return boxRequest(`/sessions/${sessionId}/events`, login, {
    headers: { Accept: "text/event-stream" },
    signal,
  });
}

interface SseFrame {
  readonly event: string;
  readonly data: string;
}

function parseFrame(raw: string): SseFrame | undefined {
  let event = "message";
  const data: string[] = [];
  for (const line of raw.split("\n")) {
    // Строки с двоеточия в начале — отбивка, держащая соединение, в ней нет события.
    if (line === "" || line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon < 0 ? line : line.slice(0, colon);
    const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  return data.length > 0 ? { event, data: data.join("\n") } : undefined;
}

/** Кадры потока: разделены пустой строкой, приходят кусками произвольной нарезки — поэтому склейка
 *  в буфер, а не разбор каждого куска по отдельности. */
async function* readFrames(body: ReadableStream<Uint8Array>): AsyncGenerator<SseFrame> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) return;
      // Нормализуем ВЕСЬ буфер, а не только пришедший кусок: `\r\n` может разъехаться по границе
      // кусков, и тогда разделитель кадров в нём не нашёлся бы.
      buffer = (buffer + decoder.decode(chunk.value, { stream: true })).replaceAll("\r\n", "\n");
      for (let boundary = buffer.indexOf("\n\n"); boundary >= 0; boundary = buffer.indexOf("\n\n")) {
        const frame = parseFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (frame) yield frame;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function asToolCalls(payload: unknown): readonly ChatToolCall[] {
  return listOf<Record<string, unknown>>(payload, "steps").map((step) => ({
    server: typeof step["server"] === "string" ? step["server"] : "",
    tool: typeof step["tool"] === "string" ? step["tool"] : "",
    arguments: step["arguments"],
  }));
}

function asRunResult(payload: Record<string, unknown>): ChatRunResult {
  return {
    event: typeof payload["event"] === "string" ? payload["event"] : "run-finished",
    run: String(payload["run"] ?? ""),
    state: typeof payload["state"] === "string" ? payload["state"] : "completed",
    reply: typeof payload["reply"] === "string" ? payload["reply"] : null,
    refusal: typeof payload["refusal"] === "string" ? payload["refusal"] : null,
    means: typeof payload["means"] === "string" ? payload["means"] : null,
    did: asToolCalls(payload["did"]),
  };
}

/** Ждёт в потоке конец ИМЕННО нашего прогона: в одной сессии событий может идти несколько, чужие
 *  (`run-started`, `run-step`, конец соседнего прогона) пропускаются. */
async function awaitRunInStream(response: Response, runId: string): Promise<ChatRunResult> {
  if (!response.body) throw new StreamEndedError("поток событий пришёл без тела");
  for await (const frame of readFrames(response.body)) {
    if (frame.event !== "run-finished" && frame.event !== "run-canceled") continue;
    const payload = JSON.parse(frame.data) as Record<string, unknown>;
    if (payload["run"] !== runId) continue;
    return asRunResult(payload);
  }
  throw new StreamEndedError("поток событий кончился раньше конца прогона");
}

/** Ответ агента и наблюдённые вызовы — из истории, без потока. Реплика лежит в сообщении с
 *  `author: "agent"` и нашим `run_id`, вызовы — в шагах прогона. */
async function collectRunResult(
  login: string,
  sessionId: string,
  run: Record<string, unknown>,
): Promise<ChatRunResult> {
  const runId = String(run["id"]);
  const [history, steps] = await Promise.all([
    boxJson<unknown>(`/sessions/${sessionId}/messages`, login),
    boxJson<unknown>(`/sessions/${sessionId}/runs/${runId}/steps`, login),
  ]);
  const reply = listOf<Record<string, unknown>>(history, "messages")
    .filter((message) => message["author"] === "agent" && message["run_id"] === runId)
    .map((message) => message["text"])
    .findLast((text): text is string => typeof text === "string");

  return {
    event: "run-finished",
    run: runId,
    state: typeof run["state"] === "string" ? run["state"] : "completed",
    reply: reply ?? null,
    refusal: typeof run["refusal"] === "string" ? run["refusal"] : null,
    means: typeof run["means"] === "string" ? run["means"] : null,
    did: asToolCalls(steps),
  };
}

/** Дочитывание оборванного прогона: обрыв потока прогон не останавливает, состояние видно в
 *  `/runs`, ответ — в истории сообщений. */
async function pollRunResult(
  login: string,
  sessionId: string,
  runId: string,
  signal: AbortSignal,
): Promise<ChatRunResult> {
  for (;;) {
    const runs = listOf<Record<string, unknown>>(
      await boxJson<unknown>(`/sessions/${sessionId}/runs`, login),
      "runs",
    );
    const run = runs.find((item) => item["id"] === runId);
    if (run && run["state"] !== "working") return await collectRunResult(login, sessionId, run);
    if (signal.aborted) throw new Error("агент не ответил за отведённое время");
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Шлёт сообщение в сессию агента и отдаёт ответ прогона (`run-finished`).
 *
 * Сессию чат НЕ заводит и НЕ хранит: логин и её id лежат в сторе юзера (`entities/user`) — id
 * выдаётся боксом на входе юзера и берётся отсюда готовым. Единственное исключение — сессия
 * перестала существовать (404): тогда чат просит стор завести новую (`renewSession`) и повторяет
 * ход один раз, чтобы обрыв на стороне бокса не съедал сообщение юзера.
 *
 * Порядок остального продиктован контрактом бокса: поток событий открывается ДО POST (иначе конец
 * быстрого прогона можно не застать), POST отдаёт только квитанцию с `run`, а сам ответ забирается
 * из потока. Оборвался поток — прогон не пропал, дочитываем через `/runs` + `/messages`.
 */
export async function sendChatMessage(text: string): Promise<ChatRunResult> {
  const component = currentComponent();
  if (!component) throw new Error("нет выбранного компонента — не про что говорить с агентом");
  const login = currentUser();
  if (!login) throw new Error("не залогинен — бокс без X-User-Login отвечает 401");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUN_TIMEOUT_MS);
  try {
    let events: Response | undefined;
    let runId = "";
    let sessionId = "";
    // Две попытки: сохранённая на входе сессия могла не пережить бокс (404 — «нет или чужая»),
    // тогда стор заводит новую и ход повторяется. Второй 404 — уже не про протухший id.
    for (let attempt = 0; attempt < 2; attempt++) {
      sessionId = currentSession() ?? (await renewSession());
      try {
        events = await openEvents(login, sessionId, controller.signal);
        runId = await postMessage(login, sessionId, text, component);
        break;
      } catch (error) {
        void events?.body?.cancel();
        events = undefined;
        if (attempt === 0 && error instanceof BoxHttpError && error.status === 404) {
          // Именно здесь, а не «на следующем витке»: в сторе всё ещё лежит мёртвый id, и без
          // явной замены второй заход ушёл бы в тот же 404.
          await renewSession();
          continue;
        }
        throw error;
      }
    }
    if (!events) throw new Error("поток событий чата не открылся");

    try {
      return await awaitRunInStream(events, runId);
    } catch (error) {
      if (controller.signal.aborted) throw new Error("агент не ответил за отведённое время");
      if (!(error instanceof StreamEndedError)) throw error;
      return await pollRunResult(login, sessionId, runId, controller.signal);
    } finally {
      void events.body?.cancel();
    }
  } finally {
    clearTimeout(timeout);
  }
}
