// Запрос к агенту: «опиши отбор словами» → состояние фильтра.
//
// Живёт в площадке, а не в поставке, по той же причине, что и сетевое хранилище: зона не ходит
// в сеть (`PROBEWEB-8`).
//
// СЕРВИСА ЗА ЭТИМ МАРШРУТОМ ПОКА НЕТ, и это нормальное состояние, а не поломка. Поэтому здесь
// НИЧЕГО НЕ БРОСАЕТСЯ: ответ всегда одной формы — либо состояние, либо человеческая причина.
// Кнопка, повисшая на необработанном исключении, и белый экран — ровно то, что выстрелит на
// показе, а не в разработке.
//
// Пришедшее состояние — ЧУЖОЙ ВВОД. Здесь оно `unknown` и остаётся им: разбирает его
// `parseFilter` у вызывающего, как файл переходника и как ответ хранилища.

import { trace } from "./trace.js";

/** Ответ агента: либо состояние отбора, либо причина, которую можно показать человеку. */
export type AgentAnswer = { ok: true; state: unknown } | { ok: false; error: string };

/** Сколько ждём ответа, прежде чем назвать это «не дождались». */
export const AGENT_TIMEOUT_MS = 20_000;

/**
 * Спросить агента.
 *
 * @param text описание отбора словами
 * @param base адрес двери
 * @param timeoutMs предел ожидания; в пробах ставится маленьким
 * @returns состояние или причина отказа — исключений не бывает
 */
export async function askAgent(
  text: string,
  base = "/api/agent/preset",
  timeoutMs: number = AGENT_TIMEOUT_MS,
): Promise<AgentAnswer> {
  const asked = text.trim();
  if (asked === "") return { ok: false, error: "Опиши отбор словами — пустой запрос агенту не о чем." };

  const done = trace("agent.ask");
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), timeoutMs);

  try {
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: asked }),
      signal: stop.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error:
          response.status === 404
            ? "Агент пока недоступен: сервис за этим адресом ещё не поднят."
            : `Агент ответил ${response.status}.`,
      };
    }

    const body = (await response.json()) as { state?: unknown; error?: unknown };

    // Сервис вправе сказать «не понял запрос» — это его ответ, а не поломка.
    if (typeof body.error === "string" && body.error.trim() !== "") {
      return { ok: false, error: body.error };
    }
    if (body.state === undefined || body.state === null) {
      return { ok: false, error: "Агент ответил без отбора — показывать нечего." };
    }

    return { ok: true, state: body.state };
  } catch (error) {
    // Сюда попадают обрыв связи, отсутствующий сервис и наш собственный предел ожидания.
    return {
      ok: false,
      error:
        error instanceof DOMException && error.name === "AbortError"
          ? "Агент не ответил вовремя — попробуй ещё раз или собери отбор руками."
          : "Агент пока недоступен: сервис не отвечает. Отбор можно собрать руками.",
    };
  } finally {
    clearTimeout(timer);
    done();
  }
}
