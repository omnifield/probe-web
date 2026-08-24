// Сохранённые отборы: состояние интерфейса поверх контракта хранилища.
//
// Здесь нет ни `fetch`, ни знания о том, где лежат пресеты, — только контракт `PresetStore` и
// правило, ради которого он заведён: **всё, что пришло из хранилища, проходит `parseFilter`**.
// Хранилище отдаёт что положили, включая мусор и чужую версию; тот, кто это применяет, обязан
// проверить. Иначе один кривой пресет роняет стенд, а виноватым выглядит фильтр.
//
// Отбор, собранный руками, и отбор, пришедший от агента, сохраняются ОДИНАКОВО (`PROBEWEB-8`,
// правило четвёртое): хранится готовое состояние, а не текст запроса. Иначе применение
// сохранённого означало бы новый поход к модели — плата за каждый показ, задержка и, что хуже,
// другой набор условий на тех же словах.

import { type Accessor, createSignal } from "solid-js";

import { parseFilter, type PresetInfo, serializeFilter } from "../filters/index.js";
import { createStandStore, type StandStore, type StoreMode } from "./remote-store.js";
import type { Stand } from "./stand.js";
import { trace } from "./trace.js";

export interface Saved {
  /** Перечень сохранённого — без содержимого. */
  items: Accessor<PresetInfo[]>;
  /** Где лежит сохранённое на самом деле. Говорится человеку вслух. */
  mode: Accessor<StoreMode>;
  /** Последнее, что случилось: отказ хранилища, кривой пресет, подтверждение. `null` — тихо. */
  notice: Accessor<string | null>;
  /** Идёт обращение к хранилищу — кнопки на это время выключаются. */
  busy: Accessor<boolean>;
  refresh(): Promise<void>;
  /** Сохранить ТЕКУЩИЙ отбор под именем. `false` — не сохранилось, причина в `notice`. */
  save(label: string, hint?: string): Promise<boolean>;
  /** Применить сохранённое к стенду. */
  apply(id: string): Promise<void>;
  remove(id: string): Promise<void>;
}

const reason = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Заводит работу с сохранёнными отборами.
 *
 * @param stand общее состояние стенда — туда применяется выбранный пресет
 * @param backing хранилище стенда; в пробах подменяется на память
 */
export function createSaved(stand: Stand, backing: StandStore = createStandStore()): Saved {
  const [items, setItems] = createSignal<PresetInfo[]>([]);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [mode, setMode] = createSignal<StoreMode>(backing.mode());

  backing.subscribe(() => setMode(backing.mode()));

  const through = async <T>(what: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    try {
      return await what();
    } catch (error) {
      setNotice(reason(error));
      return null;
    } finally {
      setMode(backing.mode());
      setBusy(false);
    }
  };

  const refresh = async (): Promise<void> => {
    const done = trace("saved.refresh");
    const list = await through(() => backing.store.list());
    if (list !== null) setItems(list);
    done(`${items().length} шт.`);
  };

  return {
    items,
    mode,
    notice,
    busy,
    refresh,

    save: async (label, hint) => {
      setNotice(null);
      const info = await through(() =>
        backing.store.save({
          label,
          ...(hint === undefined || hint.trim() === "" ? {} : { hint }),
          // Кладём сериализованный вид, а не живое состояние: в хранилище едет JSON, и
          // сериализация — та же самая, что читается обратно `parseFilter`.
          state: serializeFilter(stand.filter()),
        }),
      );

      if (info === null) return false;

      await refresh();
      setNotice(
        backing.mode() === "local"
          ? `«${info.label}» сохранён ТОЛЬКО в этой вкладке: хранилище недоступно.`
          : `«${info.label}» сохранён — его видят все, кто открыл стенд.`,
      );
      return true;
    },

    apply: async (id) => {
      setNotice(null);
      const stored = await through(() => backing.store.load(id));
      if (stored === null) {
        setNotice("Этого отбора в хранилище больше нет — обнови список.");
        return;
      }

      // ЧУЖОЙ ВВОД: хранилище формата не знает и отдаёт что положили.
      const parsed = parseFilter(stored.state);
      if (!parsed.ok) {
        setNotice(`«${stored.label}» не читается: ${parsed.error}`);
        return;
      }

      stand.setFilter(parsed.state);
    },

    remove: async (id) => {
      setNotice(null);
      await through(() => backing.store.remove(id));
      await refresh();
    },
  };
}
