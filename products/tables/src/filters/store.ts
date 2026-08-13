// ХРАНИЛИЩЕ ПРЕСЕТОВ — контракт, и ни одной строки сети.
//
// Правило шва (`kb:PROBEWEB-8`): бэк ХРАНИТ, зона ПОНИМАЕТ. Хранилище принимает непрозрачный
// JSON, кладёт и отдаёт обратно; что такое фильтр, оно не знает и знать не должно. Понимание
// формата уже живёт здесь — `parseFilter` и `FILTER_FORMAT_VERSION`; научи хранилище
// разбираться в условиях, и знание окажется в двух местах, обязанных меняться синхронно.
//
// Отсюда две вещи, которые видно прямо в типах:
//
//   • `state` у сохранённого — `unknown`. Не `FilterState`: то, что пришло с той стороны, это
//     ЧУЖОЙ ВВОД, даже если полчаса назад мы сами его туда положили. Между хранилищем и
//     показом обязан стоять `parseFilter`, и тип это требование выражает, а не описывает.
//   • все четыре действия асинхронные — синхронный контракт не примет удалённую реализацию,
//     и переделывать пришлось бы вместе с интерфейсом.
//
// Реализации HTTP здесь нет и быть не может: зона поставляется как библиотека, а библиотека,
// которая ходит в сеть по зашитому адресу, перестаёт собираться у потребителя без этого
// адреса (`kb:PROBEWEB-4`, `kb:PROBEWEB-5`). Ходящая по сети реализация живёт в площадке.

import { trace } from "./trace.js";

/** Сохранённый отбор БЕЗ содержимого: столько, сколько нужно списку. */
export interface PresetInfo {
  id: string;
  /** Имя — обязательно: из списка выбирают по названию, а не по содержимому. */
  label: string;
  /** Пояснение — необязательно: заставлять описывать очевидный отбор незачем. */
  hint?: string;
  /** Когда сохранён, ISO-8601. Ставит хранилище, а не клиент. */
  savedAt: string;
}

/**
 * Сохранённый отбор целиком.
 *
 * `state` — `unknown` НАМЕРЕННО: читатель обязан прогнать его через `parseFilter`.
 */
export interface StoredPreset extends PresetInfo {
  state: unknown;
}

/** Что кладём: имя, необязательное пояснение и состояние отбора. */
export interface PresetInput {
  label: string;
  hint?: string;
  state: unknown;
}

/**
 * Контракт хранилища. Реализацию подменяют, не трогая зону: память сегодня, удалённое
 * хранилище завтра, чужое хранилище потребителя послезавтра.
 *
 * **Отказ едет отклонённым промисом с человеческим текстом** — превышен предел, нет связи,
 * хранилище ответило не тем. Отдельного типа ошибки нет специально: у удалённой реализации
 * набор причин свой, и общий перечень пришлось бы держать синхронно с каждой из них.
 */
export interface PresetStore {
  /** Перечень сохранённого — без содержимого. */
  list(): Promise<PresetInfo[]>;
  /** Взять по идентификатору; `null` — такого нет. */
  load(id: string): Promise<StoredPreset | null>;
  /** Сохранить и получить, что получилось (идентификатор выдаёт хранилище). */
  save(input: PresetInput): Promise<PresetInfo>;
  /** Удалить. Удаление несуществующего — не ошибка: результат тот же. */
  remove(id: string): Promise<void>;
}

/**
 * Ограничители — в первой же версии, а не «потом» (`kb:PROBEWEB-8`).
 *
 * Стенд публичный и без авторизации: писать может любой, кто знает адрес. Без предела
 * хранилище забивается за вечер, и чинить это придётся ровно тогда, когда стенд показывают.
 * Предел дешевле авторизации и решает ту задачу, которая реально стоит.
 */
export const PRESET_LIMITS = {
  /** Длина имени — столько, чтобы список читался. */
  label: 120,
  /** Длина пояснения. */
  hint: 400,
  /** Размер состояния в байтах JSON. Отбор из сотни условий сюда влезает с запасом. */
  state: 64 * 1024,
  /** Сколько записей держим всего. */
  count: 200,
} as const;

/** Проверка входа — общая для любой реализации: отказ должен быть одинаковым везде. */
export function checkPresetInput(input: PresetInput, current: number): string | null {
  const label = input.label.trim();
  if (label === "") return "Имя обязательно: из списка выбирают по названию.";
  if (label.length > PRESET_LIMITS.label)
    return `Имя длиннее ${PRESET_LIMITS.label} символов — сократи.`;
  if ((input.hint?.length ?? 0) > PRESET_LIMITS.hint)
    return `Пояснение длиннее ${PRESET_LIMITS.hint} символов — сократи.`;

  const size = JSON.stringify(input.state ?? null).length;
  if (size > PRESET_LIMITS.state)
    return `Отбор занимает ${size} байт — больше предела ${PRESET_LIMITS.state}.`;

  if (current >= PRESET_LIMITS.count)
    return `Сохранено уже ${current} отборов — предел ${PRESET_LIMITS.count}. Удали ненужные.`;

  return null;
}

/**
 * Хранилище В ПАМЯТИ — поставляется вместе с зоной.
 *
 * Нужно двум: пробам, которым сервис не нужен, и площадке, которая обязана оставаться живой,
 * когда сервиса нет. Умирает вместе со вкладкой, и это его честное свойство: тот, кто им
 * пользуется, должен СКАЗАТЬ человеку, что сохранённое никуда не уехало.
 *
 * @param seed что уже лежит в хранилище на старте
 * @param now откуда берётся отметка времени; подменяется в пробах
 */
export function createMemoryPresetStore(
  seed: readonly StoredPreset[] = [],
  now: () => Date = () => new Date(),
): PresetStore {
  const items = new Map<string, StoredPreset>(seed.map((one) => [one.id, { ...one }]));
  let counter = 0;

  const info = (one: StoredPreset): PresetInfo => {
    const { state: _state, ...rest } = one;
    return { ...rest };
  };

  return {
    list: async () => {
      const done = trace("store.list");
      const all = [...items.values()].map(info);
      done(`${all.length} шт.`);
      return all;
    },

    load: async (id) => {
      const found = items.get(id);
      return found ? { ...found } : null;
    },

    save: async (input) => {
      const refusal = checkPresetInput(input, items.size);
      if (refusal !== null) throw new Error(refusal);

      counter += 1;
      const stored: StoredPreset = {
        id: `local-${counter}`,
        label: input.label.trim(),
        ...(input.hint === undefined || input.hint.trim() === ""
          ? {}
          : { hint: input.hint.trim() }),
        savedAt: now().toISOString(),
        state: input.state,
      };

      items.set(stored.id, stored);
      return info(stored);
    },

    remove: async (id) => {
      items.delete(id);
    },
  };
}
