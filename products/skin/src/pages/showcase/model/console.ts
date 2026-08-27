// КОНСОЛЬ СОБЫТИЙ — живой лог того, что дерево сказало наружу (`on`/`dispatch`, `PWEB-157`).
//
// Постановка user (дословно, 2026-08-27): «я хочу что-то типо консоли где буду видеть все ивенты
// тыкая на компонент на витрине».
//
// ОДНА ТОЧКА ВХОДА НА ВСЮ ВИТРИНУ, а не своя по карточке: `dispatch` — то же самое
// проектное решение, что и `data` у bind (`PWEB-156`), — один канал наружу, не десяток колбэков
// по числу показанных случаев. Каждый `RenderTree` на витрине зовёт ОДИН и тот же `log`.

import { createSignal } from "solid-js";
import type { DispatchedEvent } from "@omnifield/probe-web-assembly";

/** Предел записей — лог растёт, пока смотрят, и не должен раздувать память бесконечно. */
const LIMIT = 200;

export function createConsoleState() {
  const [events, setEvents] = createSignal<readonly DispatchedEvent[]>([]);

  /** Новое — В НАЧАЛО: человек смотрит на последнее произошедшее, не листает вниз за ним. */
  const log = (event: DispatchedEvent) => {
    setEvents((previous) => [event, ...previous].slice(0, LIMIT));
  };

  const clear = () => setEvents([]);

  return { events, log, clear };
}

export type ConsoleState = ReturnType<typeof createConsoleState>;
