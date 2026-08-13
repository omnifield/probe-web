// Хранилище: кладёт JSON и отдаёт обратно. ЧТО именно лежит внутри `state` — не его дело
// (`kb:PROBEWEB-8`): оно ни разу не заглядывает в состояние, не проверяет условия и не
// мигрирует версии. Понимание формата живёт в зоне `tables` и должно жить в одном месте.
//
// Устройство: ОДИН ФАЙЛ НА ПРЕСЕТ плюс перечень в памяти.
//
// Почему не один общий файл со всеми записями: его пришлось бы целиком переписывать на каждое
// сохранение (двести записей ради одной новой), и две одновременные записи наступали бы друг
// другу на пятки. Отдельные файлы не пересекаются вовсе — «две вкладки сохраняют разом» это
// две записи в два разных файла.
//
// Почему перечень держится в памяти: список отдаётся БЕЗ содержимого, а собрать его с диска
// значит прочитать и разобрать все файлы целиком — ровно то, чего список и должен избегать.
// Цена названа: перечень верен, пока с каталогом работает ОДИН процесс. Два процесса на одном
// томе не поддерживаются — второй не увидит чужих записей до перезапуска.

import { randomUUID } from "node:crypto";
import { mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

import { LIMITS } from "./limits.js";
import { trace } from "./trace.js";

/**
 * Запись без содержимого — то, из чего собирается список.
 *
 * @typedef {object} PresetMeta
 * @property {string} id выдан службой, не клиентом
 * @property {string} label обязательное имя
 * @property {string} [description] необязательное пояснение
 * @property {string} savedAt когда сохранён, ISO-8601
 */

/**
 * Запись целиком. `state` — НЕПРОЗРАЧНЫЙ кусок JSON: положили как дали, отдали как есть.
 *
 * @typedef {PresetMeta & { state: unknown }} PresetRecord
 */

/** Хранилище заполнено: записей столько, сколько разрешено. */
export class StorageFull extends Error {
  /** @param {number} limit */
  constructor(limit) {
    super(`хранилище заполнено: разрешено ${limit} пресетов`);
    this.name = "StorageFull";
    /** @type {number} */
    this.limit = limit;
  }
}

/** Имя файла записи. Идентификатор выдаём мы, поэтому в имени не бывает ничего постороннего. */
const FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.json$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Незавершённая запись: остаётся от процесса, убитого посреди сохранения. */
const TMP_PREFIX = ".tmp-";

/**
 * Записать файл так, чтобы читатель не увидел половину.
 *
 * Три шага, и каждый закрывает свою дыру:
 * 1. пишем во временный файл и сбрасываем его на диск (`sync`) — иначе переименование
 *    опубликует имя, за которым ещё нет содержимого;
 * 2. `rename` в пределах каталога атомарен (POSIX) — читатель видит либо старый файл, либо
 *    новый, но никогда не половину;
 * 3. сбрасываем на диск САМ КАТАЛОГ — без этого переименование живёт только в кеше, и после
 *    внезапной перезагрузки машины возвращается старое имя.
 *
 * Сверено с рынком 2026-08-13: `npm/write-file-atomic` (issue #64 «Rename atomicity is not
 * enough») и разбор crash-consistency — обе точки говорят одно: «атомарно» и «долговечно» это
 * разные свойства, и второе требует `fsync` файла И каталога. Библиотеку не берём — это
 * зависимость в поставку (решение architect, `shared-policy`), а нужного здесь на двадцать
 * строк.
 *
 * @param {string} dir
 * @param {string} name итоговое имя файла
 * @param {string} text
 * @returns {Promise<void>}
 */
async function writeAtomic(dir, name, text) {
  const tmp = join(dir, `${TMP_PREFIX}${randomUUID()}`);

  const file = await open(tmp, "wx");
  try {
    await file.writeFile(text, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }

  try {
    await rename(tmp, join(dir, name));
  } catch (error) {
    await unlink(tmp).catch(() => {});
    throw error;
  }

  await syncDir(dir);
}

/**
 * Сбросить на диск каталог — чтобы переименование и удаление пережили внезапную перезагрузку.
 *
 * Открыть каталог на чтение умеет не всякая платформа (на Windows это отказ). Мы едем в
 * контейнере на Linux, поэтому отказ здесь не фатален: содержимое файла уже сброшено, теряется
 * только долговечность ИМЕНИ. Молча глотаем именно этот случай и ничего больше.
 *
 * @param {string} dir
 * @returns {Promise<void>}
 */
async function syncDir(dir) {
  /** @type {import("node:fs/promises").FileHandle} */
  let handle;
  try {
    handle = await open(dir, "r");
  } catch {
    return;
  }
  try {
    await handle.sync();
  } catch {
    // тот же случай: платформа не умеет fsync каталога
  } finally {
    await handle.close();
  }
}

/**
 * Открыть хранилище в каталоге. Каталог создаётся, если его нет; уже лежащие там записи
 * подхватываются — на этом и держится переживание перезапуска.
 *
 * @param {string} dir каталог с записями (в контейнере — том, а не слой образа)
 * @param {Readonly<import("./limits.js").Limits>} [limits]
 */
export async function openStore(dir, limits = LIMITS) {
  const done = trace("store.open");

  await mkdir(dir, { recursive: true });

  /** @type {Map<string, PresetMeta>} */
  const index = new Map();

  /**
   * Сколько записей уже начали сохраняться, но ещё не попали в перечень. Без этого счётчика
   * два одновременных сохранения на последнем свободном месте оба прошли бы проверку предела:
   * место занимается СРАЗУ, а не после записи на диск.
   */
  let reserved = 0;

  const entries = await readdir(dir);
  for (const entry of entries) {
    if (entry.startsWith(TMP_PREFIX)) {
      // Хвост от процесса, убитого посреди сохранения. Такой файл никто никогда не прочитает
      // (его имени нет в перечне), но копиться ему незачем.
      await unlink(join(dir, entry)).catch(() => {});
      continue;
    }
    if (!FILE.test(entry)) continue;

    const record = await readRecord(dir, entry);
    if (!record) continue;
    index.set(record.id, meta(record));
  }

  done(`каталог ${dir}, записей ${index.size}`);

  return {
    /** Сколько записей лежит сейчас. */
    get size() {
      return index.size;
    },

    /** Каталог, в котором лежат записи. */
    get dir() {
      return dir;
    },

    /**
     * Перечень — БЕЗ содержимого: список нужен для имён, тянуть ради него все состояния
     * незачем. Новые сверху: сохранённое только что человек ищет первым.
     *
     * @returns {PresetMeta[]}
     */
    list() {
      const done = trace("store.list");
      const items = [...index.values()].sort(
        (a, b) => b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id),
      );
      done(`записей ${items.length}`);
      return items;
    },

    /**
     * Взять запись целиком. Нет такой — `null`, а не исключение: «не найдено» это обычный
     * ответ хранилища, а не поломка.
     *
     * @param {string} id
     * @returns {Promise<PresetRecord | null>}
     */
    async read(id) {
      const done = trace("store.read");
      if (!ID.test(id) || !index.has(id)) {
        done("не найдено");
        return null;
      }
      const record = await readRecord(dir, `${id}.json`);
      done(record ? "отдано" : "файл пропал");
      return record;
    },

    /**
     * Положить новую запись. Идентификатор и время выдаём мы — клиент их не присылает.
     *
     * `state` уходит на диск КАК ЕСТЬ. Ни одной проверки внутри него здесь нет и быть не
     * должно: это и есть правило зоны.
     *
     * @param {{ label: string, description?: string, state: unknown }} input
     * @returns {Promise<PresetRecord>}
     * @throws {StorageFull} мест больше нет
     */
    async create(input) {
      const done = trace("store.create");

      if (index.size + reserved >= limits.records) throw new StorageFull(limits.records);
      reserved += 1;

      try {
        const id = randomUUID();
        /** @type {PresetRecord} */
        const record = {
          id,
          label: input.label,
          ...(input.description === undefined ? {} : { description: input.description }),
          savedAt: new Date().toISOString(),
          state: input.state,
        };

        await writeAtomic(dir, `${id}.json`, JSON.stringify(record));
        index.set(id, meta(record));
        done(`записей ${index.size}`);
        return record;
      } finally {
        reserved -= 1;
      }
    },

    /**
     * Удалить. Возвращает, было ли что удалять.
     *
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async remove(id) {
      const done = trace("store.remove");
      if (!ID.test(id) || !index.delete(id)) {
        done("не найдено");
        return false;
      }
      await unlink(join(dir, `${id}.json`)).catch(() => {});
      await syncDir(dir);
      done(`записей ${index.size}`);
      return true;
    },
  };
}

/**
 * @param {PresetRecord} record
 * @returns {PresetMeta}
 */
function meta(record) {
  return {
    id: record.id,
    label: record.label,
    ...(record.description === undefined ? {} : { description: record.description }),
    savedAt: record.savedAt,
  };
}

/**
 * Прочитать файл записи. Битый файл НЕ роняет службу и не подменяется пустышкой: он
 * пропускается, а событие называется вслух — иначе запись исчезает молча, и никто не узнает.
 *
 * @param {string} dir
 * @param {string} name
 * @returns {Promise<PresetRecord | null>}
 */
async function readRecord(dir, name) {
  /** @type {string} */
  let text;
  try {
    const file = await open(join(dir, name), "r");
    try {
      text = await file.readFile("utf8");
    } finally {
      await file.close();
    }
  } catch {
    return null;
  }

  try {
    const parsed = /** @type {unknown} */ (JSON.parse(text));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("не объект");
    const record = /** @type {Partial<PresetRecord>} */ (parsed);
    if (typeof record.id !== "string" || typeof record.label !== "string") {
      throw new Error("нет обязательных полей");
    }
    if (typeof record.savedAt !== "string") throw new Error("нет времени сохранения");
    return /** @type {PresetRecord} */ (record);
  } catch (error) {
    console.warn(
      `[probe-web-presets] файл ${name} пропущен: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}
