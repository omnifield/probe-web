import { createSignal } from "solid-js";

import { createSession } from "#/shared/api/box";

// Между сессиями — просто localStorage, без стора/бэка (пока). Логин и выданный боксом id сессии
// лежат РЯДОМ и живут одной жизнью: сессия видна только своему логину (чужая отвечает 404, как
// несуществующая), поэтому порознь они бессмысленны.
const STORAGE_KEY = "user";
const SESSION_KEY = "session";

const [currentUser, setCurrentUser] = createSignal<string | undefined>(
  localStorage.getItem(STORAGE_KEY) ?? undefined,
);

/** Айди сессии агента этого юзера. Выдаёт бокс на входе (`login`), берут все, кому нужно с ним
 *  поговорить — чат подставляет его в адрес каждого запроса. */
const [currentSession, setCurrentSession] = createSignal<string | undefined>(
  localStorage.getItem(SESSION_KEY) ?? undefined,
);

export { currentSession, currentUser };

/**
 * Залогинить: личность ложится сразу (она локальная, пароль сверяется на клиенте), следом сразу же
 * заводится сессия в боксе и её id ложится рядом с логином.
 *
 * Бокс не ответил — юзер всё равно вошёл, а не заперт на входе: витрина живёт и без чата. Ошибка
 * при этом отдаётся наверх (форма входа показывает её тостом), сессию можно завести повторно
 * `renewSession()` — чат так и делает.
 */
export async function login(user: string): Promise<void> {
  localStorage.setItem(STORAGE_KEY, user);
  setCurrentUser(user);
  await renewSession();
}

/** Разлогинить — чистит и логин, и сессию: без логина она всё равно не откроется. */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
  setCurrentUser(undefined);
  setCurrentSession(undefined);
}

/**
 * Завести сессию заново под текущим логином — на входе и когда прежняя перестала существовать
 * (бокс ответил 404). Старый id стирается ДО запроса: он уже мёртв, и ходить с ним нельзя даже
 * если новый не выдадут.
 */
export async function renewSession(): Promise<string> {
  const user = currentUser();
  if (!user) throw new Error("не залогинен — сессию агента заводить не под кем");

  localStorage.removeItem(SESSION_KEY);
  setCurrentSession(undefined);

  const id = await createSession(user);
  localStorage.setItem(SESSION_KEY, id);
  setCurrentSession(id);
  return id;
}
