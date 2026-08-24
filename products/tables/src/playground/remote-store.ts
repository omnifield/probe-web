// Хранилище пресетов ПО СЕТИ — живёт в площадке, а не в поставляемой части зоны.
//
// Так требует шов (`PROBEWEB-8`): библиотека, которая ходит в сеть по зашитому адресу,
// перестаёт собираться у потребителя без этого адреса. Зона объявила контракт (`PresetStore`),
// а кто за ним стоит — дело того, кто её ставит. Здесь стоит наш сервис.
//
// Поверхность задана architect'ом (`PROBEWEB-39`):
//   GET    /api/presets        → {items:[{id,label,description?,savedAt}]}
//   GET    /api/presets/{id}   → {id,label,description?,savedAt,state}
//   POST   /api/presets        → {id,label,description?,savedAt}
//   DELETE /api/presets/{id}   → 204
//
// ИМЯ ПОЛЯ РАСХОДИТСЯ НАМЕРЕННО, и это единственное место, где расхождение живёт: на проводе
// пояснение зовётся `description`, в зоне — `hint` (так объявлено в `Preset` с первой волны).
// Перевод — здесь, одной строкой в каждую сторону; в отчёте это названо architect'у.

import type { PresetInfo, PresetInput, PresetStore, StoredPreset } from "../filters/index.js";
import { createMemoryPresetStore } from "../filters/index.js";
import { trace } from "./trace.js";

/** Что отдаёт сервис. Чужой ответ, поэтому разбирается, а не приводится типом. */
interface WirePreset {
  id?: unknown;
  label?: unknown;
  description?: unknown;
  savedAt?: unknown;
  state?: unknown;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/**
 * Перевод с провода: имя и время обязаны быть строками, иначе список молча покажет `undefined`.
 * Сервис у нас свой, но ответ от него — такой же чужой ввод, как файл переходника.
 */
function toInfo(wire: WirePreset): PresetInfo {
  const hint = text(wire.description);
  return {
    id: text(wire.id),
    label: text(wire.label),
    ...(hint === "" ? {} : { hint }),
    savedAt: text(wire.savedAt),
  };
}

/**
 * Сервис ОТВЕТИЛ и отказал: превышен предел, кривой ввод. Это не «нет связи», и путать их
 * нельзя — иначе отказ по пределу молча уронил бы стенд в память, и человек считал бы отбор
 * сохранённым для всех, хотя сервис его как раз не взял.
 */
export class PresetRefused extends Error {}

/** Ответ сервиса об отказе: сначала его текст, и только потом сухой код. */
async function refusal(response: Response): Promise<PresetRefused> {
  const said = await response.text().catch(() => "");
  return new PresetRefused(said.trim() === "" ? `хранилище отказало (${response.status})` : said.trim());
}

async function ask(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) return response;
  // 4xx — ответ по делу; 5xx и обрыв связи — «сервиса нет», их ловит переключение в память.
  if (response.status < 500) throw await refusal(response);
  throw new Error(`хранилище ответило ${response.status}`);
}

/**
 * Хранилище на нашем сервисе.
 *
 * @param base адрес двери; по умолчанию тот же источник, что и площадка
 */
export function createHttpPresetStore(base = "/api/presets"): PresetStore {
  return {
    list: async () => {
      const done = trace("store.http.list");
      const body = (await (await ask(base)).json()) as { items?: unknown };
      const items = Array.isArray(body.items) ? body.items : [];
      done(`${items.length} шт.`);
      return items.map((one) => toInfo(one as WirePreset));
    },

    load: async (id) => {
      const response = await fetch(`${base}/${encodeURIComponent(id)}`);
      if (response.status === 404) return null;
      if (!response.ok) {
        if (response.status < 500) throw await refusal(response);
        throw new Error(`хранилище ответило ${response.status}`);
      }

      const wire = (await response.json()) as WirePreset;
      return { ...toInfo(wire), state: wire.state } satisfies StoredPreset;
    },

    save: async (input: PresetInput) => {
      const response = await ask(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: input.label,
          ...(input.hint === undefined ? {} : { description: input.hint }),
          state: input.state,
        }),
      });

      return toInfo((await response.json()) as WirePreset);
    },

    remove: async (id) => {
      await ask(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

/** Где на самом деле лежит сохранённое. Человеку это говорят вслух. */
export type StoreMode = "service" | "local";

export interface StandStore {
  store: PresetStore;
  /** Куда ушла последняя операция. Меняется на `local`, когда сервис не ответил. */
  mode: () => StoreMode;
  /** Почему съехали на память; `null` — сервис отвечает. */
  reason: () => string | null;
  subscribe: (listener: () => void) => void;
}

/**
 * Хранилище стенда: сервис, а когда его нет — память.
 *
 * Сервиса за маршрутом может НЕ БЫТЬ, и это нормальное состояние, а не поломка: стенд обязан
 * его пережить. Но подмена не бывает молчаливой — режим отдаётся наружу, и интерфейс говорит
 * «сохранено только в этой вкладке». Иначе человек сохранит отбор, будет считать его общим, а
 * тот умрёт вместе со вкладкой.
 *
 * Съехав на память, там и остаёмся до перезагрузки: дёргать мёртвый сервис на каждое нажатие
 * значит держать интерфейс в таймаутах.
 */
export function createStandStore(remote: PresetStore = createHttpPresetStore()): StandStore {
  const local = createMemoryPresetStore();
  const listeners: Array<() => void> = [];

  let mode: StoreMode = "service";
  let reason: string | null = null;

  const fallback = (error: unknown): void => {
    if (mode === "local") return;
    mode = "local";
    reason = error instanceof Error ? error.message : String(error);
    for (const listener of listeners) listener();
  };

  /**
   * Отказ ПО ДЕЛУ и мёртвый сервис — разные события: первый показываем как есть и в память НЕ
   * съезжаем, второй переключает режим. Различаем типом ошибки, а не разбором текста:
   * сообщения меняются, и гадание по ним ломается молча.
   */
  const through = async <T>(remoteCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> => {
    if (mode === "local") return localCall();
    try {
      return await remoteCall();
    } catch (error) {
      if (error instanceof PresetRefused) throw error;
      fallback(error);
      return localCall();
    }
  };

  return {
    store: {
      list: () => through(() => remote.list(), () => local.list()),
      load: (id) => through(() => remote.load(id), () => local.load(id)),
      save: (input) => through(() => remote.save(input), () => local.save(input)),
      remove: (id) => through(() => remote.remove(id), () => local.remove(id)),
    },
    mode: () => mode,
    reason: () => reason,
    subscribe: (listener) => listeners.push(listener),
  };
}
