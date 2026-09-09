// Сессия агента заводится НА ВХОДЕ юзера и лежит в сторе рядом с логином; чат её только берёт.
// Сеть — подменённый fetch, маршрутизация по адресу: проверяем ИМЕННО последовательность запросов,
// потому что цена ошибки здесь — лишняя сессия (своя память и свой счёт) или потерянный ответ.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendChatMessage } from "#/entities/chat/model/api";
import { setCurrentComponent } from "#/entities/component";
import { currentSession, currentUser, login, logout } from "#/entities/user";

interface Call {
  readonly method: string;
  readonly path: string;
  readonly headers: Headers;
  readonly body: unknown;
}

const calls: Call[] = [];

function sse(...frames: readonly string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) controller.enqueue(encoder.encode(frame));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const FINISHED =
  'event: run-finished\ndata: {"event":"run-finished","run":"run-1","state":"completed","reply":"готово","refusal":null,"means":null,"did":[{"server":"skin","tool":"save_content","arguments":{"a":1}}]}\n\n';

/** Отвечает на маршруты бокса; `override` подменяет ответ на конкретный путь. Каждая заведённая
 *  сессия получает свой id по счёту, чтобы в тесте было видно, ЗАВЕЛАСЬ ли новая. */
function serve(
  override: (path: string, method: string) => Response | undefined = () => undefined,
) {
  let issued = 0;
  return vi.fn(async (input: string, init?: RequestInit) => {
    const path = input.replace("https://150.251.145.87/api", "");
    const method = init?.method ?? "GET";
    calls.push({
      method,
      path,
      headers: new Headers(init?.headers),
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });

    const custom = override(path, method);
    if (custom) return custom;
    if (path === "/sessions" && method === "POST") {
      issued += 1;
      return json({ id: `s-${issued}` });
    }
    if (path.endsWith("/messages") && method === "POST") return json({ run: { id: "run-1" } }, 202);
    if (path.endsWith("/events")) return sse(": отбивка\n\n", FINISHED);
    return json({}, 404);
  });
}

beforeEach(() => {
  calls.length = 0;
  localStorage.clear();
  setCurrentComponent("button");
});

afterEach(() => {
  logout();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("сессия заводится на входе юзера, чат берёт её из стора", () => {
  it("логин сразу заводит сессию и кладёт id рядом с логином", async () => {
    vi.stubGlobal("fetch", serve());

    await login("ева");

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ method: "POST", path: "/sessions", body: { title: "ева" } });
    expect(currentUser()).toBe("ева");
    expect(currentSession()).toBe("s-1");
    // Пережить перезагрузку должны оба — сессия видна только своему логину.
    expect(localStorage.getItem("user")).toBe("ева");
    expect(localStorage.getItem("session")).toBe("s-1");
  });

  it("чат ходит с сохранённым id и второй сессии не заводит", async () => {
    vi.stubGlobal("fetch", serve());
    await login("ева");
    calls.length = 0;

    const result = await sendChatMessage("привет");

    expect(result.reply).toBe("готово");
    expect(result.did[0]?.tool).toBe("save_content");
    expect(calls.some((call) => call.path === "/sessions" && call.method === "POST")).toBe(false);
    expect(calls.at(-1)).toMatchObject({
      path: "/sessions/s-1/messages",
      body: { text: "привет", context: { component: "button" } },
    });
    // Оба заголовка на каждом запросе — без любого из двух бокс отвечает 401. Логин кириллицей
    // в заголовок байтами не лезет (`fetch` роняет запрос до сети), поэтому едет закодированным.
    const expected = encodeURIComponent("ева");
    expect(calls.every((call) => call.headers.get("X-User-Login") === expected)).toBe(true);
  });

  it("сессия перестала существовать (404) — стор заводит новую, сообщение не теряется", async () => {
    vi.stubGlobal(
      "fetch",
      serve((path) => (path.startsWith("/sessions/s-1") ? json({ detail: "нет" }, 404) : undefined)),
    );
    await login("ева");

    const result = await sendChatMessage("привет");

    expect(result.reply).toBe("готово");
    expect(currentSession()).toBe("s-2");
    expect(localStorage.getItem("session")).toBe("s-2");
  });

  it("поток оборвался — ответ дочитывается через /runs и историю сообщений", async () => {
    vi.stubGlobal(
      "fetch",
      serve((path, method) => {
        if (path.endsWith("/events")) return sse('event: run-started\ndata: {"run":"run-1"}\n\n');
        if (path === "/sessions/s-1/runs") return json([{ id: "run-1", state: "completed" }]);
        // Именно GET: по этому же адресу уходит POST сообщения, и он должен получить квитанцию.
        if (path === "/sessions/s-1/messages" && method === "GET") {
          return json([{ author: "agent", run_id: "run-1", text: "дочитано" }]);
        }
        if (path === "/sessions/s-1/runs/run-1/steps") {
          return json([{ server: "skin", tool: "save_content", arguments: {} }]);
        }
        return undefined;
      }),
    );
    await login("ева");

    const result = await sendChatMessage("привет");

    expect(result.reply).toBe("дочитано");
    expect(result.did[0]?.server).toBe("skin");
  });

  it("выход чистит и логин, и сессию — порознь они бессмысленны", async () => {
    vi.stubGlobal("fetch", serve());
    await login("ева");

    logout();

    expect(currentUser()).toBeUndefined();
    expect(currentSession()).toBeUndefined();
    expect(localStorage.getItem("session")).toBeNull();
  });

  it("не залогинен — запроса нет вовсе, а не 401 от бокса", async () => {
    const fetchMock = serve();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendChatMessage("привет")).rejects.toThrow(/не залогинен/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
