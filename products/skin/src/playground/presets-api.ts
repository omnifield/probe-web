// СЛУЖБА ПРЕСЕТОВ — вторая опора стенда, и живёт она ЗДЕСЬ, в площадке.
//
// Почему не в поставке (`src/presets`): поставка `skin` — это CSS-файлы, и она про службу знать
// не должна. Зона, которую берут ради вида, обязана работать там, где никакой службы нет
// (`kb:SKIN-7`, инвариант 8: результат достижим как чистый CSS). Проба стережёт: в поставке нет
// ни одного `fetch`.
//
// ПОВЕРХНОСТЬ СЛУЖБЫ задана архитектором (`tasker:PROBEWEB-39`, ярлык вида — `PROBEWEB-54`):
//   GET    /api/presets?kind=skin  → { items: [{ id, label, description?, savedAt }] }
//   GET    /api/presets/{id}       → { id, label, description?, savedAt, state }
//   POST   /api/presets            → { id, label, description?, savedAt }   — 201
//   DELETE /api/presets/{id}       → 204
//
// `kind: "skin"` — ЯРЛЫК ВИДА. Служба его не толкует: она хранит непрозрачный JSON и лишь
// отдаёт по ярлыку список. Пока парная задача (`PROBEWEB-54`) не выпущена, служба лишнее поле
// молча игнорирует, и в списке будут чужие записи — поэтому читатель ПРОВЕРЯЕТ ФОРМУ и берёт
// только то, что понимает. Это не подпорка под чужой недоделке: чужой ответ разбирают всегда.
//
// АДРЕС. Через пульт (`tools/dev-nav`) всё, кроме его собственных путей, уезжает в зону, поэтому
// относительный `/api/presets` попал бы в наш дев-сервер, а не в службу. Адрес задаётся снаружи
// (`VITE_PRESETS_URL`), умолчание — служба на этой машине. На VPS переменная называет её адрес.

import { modelOf, type Preset, type PresetMeta, type PresetSeeds } from "../presets/model.js";

const BASE =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

/** Ярлык вида: по нему служба отдаёт только оформления, не толкуя их. */
const KIND = "skin";

/**
 * Что лежит в конверте под `state`: МОДЕЛЬ ТЕМЫ (`kb:PROBEWEB-15`, решение 1). Служба в неё не
 * смотрит — хранит непрозрачный JSON.
 *
 * Это тип ПРИЁМА, и он намеренно свободнее модели базы (`ThemeModel`): сюда разбирается чужой
 * ответ, где правки тёмной пары могут назвать ступень, которой у нас ещё нет. Отправляем мы
 * ровно `ThemeModel` — асимметрия здесь не небрежность, а разные стороны шва.
 */
interface WireState {
  /** Имя ТЕМЫ — то, что уезжает в `data-theme`. Идентификатор записи выдаёт служба отдельно. */
  id: string;
  seeds: PresetSeeds;
  meta?: PresetMeta;
  darkOverrides?: Record<string, string>;
  density: string;
}

/** Чужой ответ: разбирается, а не приводится типом. */
interface WirePreset {
  id?: unknown;
  label?: unknown;
  description?: unknown;
  savedAt?: unknown;
  state?: unknown;
}

/**
 * Служба ОТВЕТИЛА и отказала: превышен предел, кривой ввод, чужой формат.
 *
 * Отличать от «службы нет» обязательно. Спутать их — значит показать человеку «сохранено», когда
 * служба как раз отказалась: он уйдёт, считая пресет общим, а тот не сохранён нигде.
 */
export class PresetRefused extends Error {}

/** Службы нет: обрыв связи или пятисотка. Стенд это переживает и говорит человеку. */
export class ServiceDown extends Error {}

async function ask(send: typeof fetch, url: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await send(url, init);
  } catch (cause) {
    // Обрыв связи — не отказ: службы просто нет по этому адресу. Человеку показывается АДРЕС, а
    // не текст ошибки движка: «TypeError: Failed to fetch» не говорит ему, что делать, а адрес
    // говорит — служба не поднята или названа неверно.
    console.debug("служба пресетов недоступна", cause);
    throw new ServiceDown(`служба не отвечает по адресу ${new URL(url).origin}`);
  }

  if (response.ok) return response;
  // Граница ровно на 500: ниже — ответ по делу, выше — сломанная служба.
  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new PresetRefused(said === "" ? `служба отказала (${response.status})` : said);
  }
  throw new ServiceDown(`служба ответила ${response.status}`);
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Похоже ли состояние на НАШ пресет. Чужие записи в общем хранилище — норма, а не ошибка. */
function isOurs(state: unknown): state is WireState {
  if (typeof state !== "object" || state === null) return false;
  const one = state as Partial<WireState>;
  return (
    typeof one.id === "string" &&
    typeof one.density === "string" &&
    typeof one.seeds === "object" &&
    one.seeds !== null &&
    typeof (one.seeds as PresetSeeds).brand === "string"
  );
}

/** Запись службы → пресет зоны. Идентификатор выдаёт служба, название несёт человек. */
function toPreset(wire: WirePreset): Preset | null {
  if (!isOurs(wire.state)) return null;
  const id = text(wire.id);
  if (id === "") return null;

  return {
    id: wire.state.id,
    recordId: id,
    title: text(wire.label) === "" ? wire.state.id : text(wire.label),
    origin: "свой",
    seeds: wire.state.seeds,
    ...(wire.state.meta === undefined ? {} : { meta: wire.state.meta }),
    ...(wire.state.darkOverrides === undefined
      ? {}
      : { darkOverrides: wire.state.darkOverrides }),
    density: wire.state.density,
  };
}

/**
 * Пресет → конверт службы. Уезжает МОДЕЛЬ, а не готовый CSS: из модели он всегда соберётся
 * (`kb:PROBEWEB-15`, решение 1). Модель собирает `modelOf()` — раскладка полей в зоне одна,
 * и той же моделью рождается файл поставки.
 *
 * Тип отправляемого — `ThemeModel` самой базы, а не наш `WireState`: он строже, и проверять
 * отправку по типу приёма значило бы проверять себя более слабым мерилом. Что уезжает именно
 * модель, а не CSS, стережёт `test/presets-api.test.ts`.
 */
function toWire(preset: Preset, description?: string): unknown {
  return {
    label: preset.title,
    ...(description === undefined || description.trim() === ""
      ? {}
      : { description: description.trim() }),
    kind: KIND,
    state: modelOf(preset),
  };
}

export interface PresetsApi {
  /** Пресеты оформления из службы. Чужие записи отбрасываются молча — они не наши. */
  list: () => Promise<Preset[]>;
  save: (preset: Preset, description?: string) => Promise<Preset>;
  remove: (id: string) => Promise<void>;
}

/**
 * Клиент службы.
 *
 * `fetch` НЕ зашит: пробы подменяют транспорт и в сеть не ходят. Проверять сохранение, гоняя
 * настоящий запрос, значит проверять сеть вместо своего кода — и получать красный прогон там,
 * где служба просто не поднята.
 */
export function createPresetsApi(base = BASE, send: typeof fetch = fetch): PresetsApi {
  return {
    list: async () => {
      const body = (await (await ask(send, `${base}?kind=${KIND}`)).json()) as { items?: unknown };
      const items = Array.isArray(body.items) ? body.items : [];

      // Список отдаётся БЕЗ содержимого — состояние приходится брать по одному. Другого пути
      // нет: без состояния пресет применить нельзя, а поверхность службы задана не нами.
      const full = await Promise.all(
        items.map(async (one) => {
          const id = text((one as WirePreset).id);
          if (id === "") return null;
          const wire = (await (await ask(send, `${base}/${encodeURIComponent(id)}`)).json()) as WirePreset;
          return toPreset(wire);
        }),
      );

      return full.filter((preset): preset is Preset => preset !== null);
    },

    save: async (preset, description) => {
      const wire = (await (
        await ask(send, base, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(toWire(preset, description)),
        })
      ).json()) as WirePreset;

      // Служба выдаёт идентификатор ЗАПИСИ, а имя темы остаётся нашим: в ответе состояния нет,
      // поэтому склеиваем ответ с тем, что отправили.
      const saved = toPreset({
        ...wire,
        state: (toWire(preset, description) as { state: unknown }).state,
      });
      if (saved === null) {
        throw new PresetRefused("служба вернула запись, которую не удалось прочесть");
      }
      return saved;
    },

    remove: async (id) => {
      await ask(send, `${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}
