// Транспорт к боксу агента — общий для тех, кто с ним разговаривает: `entities/user` заводит там
// сессию на входе юзера, `entities/chat` шлёт в неё сообщения. Живёт в shared, а не в одной из
// сущностей, чтобы вторая не импортировала первую ради адреса и заголовков.

// Тот же приём, что у PRESETS_URL (`entities/component/model/content.ts`) — билд-тайм env, свой
// адрес у каждого продукта. Токен — общий для всех юзеров витрины (`X-User-Login` несёт личность
// поверх него), поэтому он тоже билд-тайм, не за юзером.
const BOX_URL = (import.meta.env["VITE_CHAT_URL"] as string | undefined) ?? "https://150.251.145.87/api";
const BOX_TOKEN = import.meta.env["VITE_CHAT_TOKEN"] as string | undefined;

// Чем заводится сессия. Имена не выдумываются: бокс на неизвестный рецепт/паспорт/агента отвечает
// 400 с текстом, актуальные списки — `GET /api/catalog/recipes`, `/api/catalog/passports`,
// `/api/agents`. Env — чтобы сменить их на стенде без пересборки смысла кода.
const BOX_RECIPE = (import.meta.env["VITE_CHAT_RECIPE"] as string | undefined) ?? "сборка-скинов";
const BOX_PASSPORT = (import.meta.env["VITE_CHAT_PASSPORT"] as string | undefined) ?? "опус-5";
const BOX_AGENT = (import.meta.env["VITE_CHAT_AGENT"] as string | undefined) ?? "claude-code";

/** Ошибка бокса с кодом. Код нужен вызывающему: 404 значит «сессии нет или она чужая» — на него
 *  сессия заводится заново, на остальные коды повтор бессмыслен. */
export class BoxHttpError extends Error {
  readonly status: number;

  constructor(status: number, detail: string) {
    super(`бокс отказал: ${status} ${detail}`);
    this.name = "BoxHttpError";
    this.status = status;
  }
}

/**
 * Логин в форме, которую физически принимает заголовок. HTTP-заголовок — байты (ISO-8859-1), и
 * кириллический логин роняет сам `fetch` ещё до сети (`Cannot convert argument to a ByteString`),
 * а не отдаёт 401. Латиница проходит как есть, всё остальное — процентное кодирование: бокс логин
 * не проверяет, ему важно только, чтобы одна и та же личность всегда давала одну и ту же строку.
 */
function asHeaderValue(login: string): string {
  return /^[ -~]*$/.test(login) ? login : encodeURIComponent(login);
}

function boxHeaders(login: string, extra?: Record<string, string>): Record<string, string> {
  // Оба заголовка обязательны на КАЖДОМ запросе — без любого из двух бокс отвечает 401.
  const headers: Record<string, string> = { "X-User-Login": asHeaderValue(login), ...extra };
  if (BOX_TOKEN) headers["Authorization"] = `Bearer ${BOX_TOKEN}`;
  return headers;
}

async function failure(response: Response): Promise<BoxHttpError> {
  // Причина отказа приезжает в `detail` (409 — сервер из рецепта не поднялся, 400 — неизвестное
  // имя рецепта/паспорта/агента): без него в UI оседал бы голый код.
  const body = await response.text().catch(() => "");
  let detail = body;
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") detail = parsed.detail;
  } catch {
    /* не JSON — показываем как есть */
  }
  return new BoxHttpError(response.status, detail || response.statusText);
}

/** Запрос к боксу под личностью `login`. Не 2xx — `BoxHttpError`, а не молчаливый ответ-пустышка. */
export async function boxRequest(path: string, login: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${BOX_URL}${path}`, {
    ...init,
    headers: boxHeaders(login, init?.headers as Record<string, string> | undefined),
  });
  if (!response.ok) throw await failure(response);
  return response;
}

export async function boxJson<T>(path: string, login: string, init?: RequestInit): Promise<T> {
  return (await (await boxRequest(path, login, init)).json()) as T;
}

export interface BoxSession {
  readonly id: string;
  readonly title: string;
  readonly recipe: string;
  readonly passport: string;
  readonly agent: string;
}

/**
 * Заводит сессию и отдаёт выданный боксом id — свой подставить нельзя. Зовётся на входе юзера
 * (`entities/user`), поэтому `title` — его логин: компонента в этот момент ещё нет, а в списке
 * сессий бокса надпись должна называть владельца.
 */
export async function createSession(login: string): Promise<string> {
  const session = await boxJson<BoxSession>("/sessions", login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipe: BOX_RECIPE,
      passport: BOX_PASSPORT,
      agent: BOX_AGENT,
      title: login,
    }),
  });
  return session.id;
}
