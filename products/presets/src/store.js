// Хранилище: кладёт JSON и отдаёт обратно. ЧТО именно лежит внутри `state` — не его дело
// (`kb:PROBEWEB-8`): оно ни разу не заглядывает в состояние, не проверяет условия и не
// мигрирует версии. Понимание формата живёт у ВЛАДЕЛЬЦА ВИДА — отбор разбирает `tables`, скин
// разбирает `skin`, — и у каждого вида оно живёт в одном месте.
//
// Из этого же следует, что смена формы хранимого хранилище не задевает. Скин перестал быть
// набором значений и стал переменными плюс рецептами (`PWEB-13`) — здесь от этого меняются
// только ПРЕДЕЛЫ (единица стала на порядок крупнее) и ОПОЗНАНИЕ единицы (машинное имя в
// конверте). Ни одной правки про рецепты тут нет и быть не должно.
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
 * @property {string} label обязательное имя ДЛЯ ЧЕЛОВЕКА: его читают в списке
 * @property {string} [name] имя ДЛЯ МАШИНЫ — короткая метка, под которой единицу знает
 *   приложение (у скина она уезжает на корень и ею же назван порождённый файл стилей).
 *   Непрозрачна: хранилище её не толкует, но держит УНИКАЛЬНОЙ — два скина под одним именем
 *   молча переопределили бы друг друга, и разглядеть это могло бы только хранилище, потому что
 *   только оно видит все записи разом. Необязательно: у отборов имени нет
 * @property {string} [description] необязательное пояснение
 * @property {string} [kind] ярлык вида — НЕПРОЗРАЧНАЯ метка владельца (`filter`, `skin`, …);
 *   хранилище её не толкует, а только отдаёт по ней перечень. Необязателен: записи, лежащие
 *   с прошлой версии конверта, его не имеют и читаются как прежде
 * @property {string} savedAt когда сохранён, ISO-8601
 */

/**
 * Запись целиком. `state` — НЕПРОЗРАЧНЫЙ кусок JSON: положили как дали, отдали как есть.
 *
 * @typedef {PresetMeta & { state: unknown }} PresetRecord
 */

/**
 * Хранилище заполнено. Две причины и один отказ: для того, кто читает ответ, действие одно и то
 * же — удалить ненужное. Причина различается только в тексте для человека, поэтому она поле, а
 * не отдельный класс.
 */
export class StorageFull extends Error {
  /**
   * @param {"records" | "bytes"} reason кончились места в перечне или место на диске
   * @param {number} limit значение упёртого предела
   */
  constructor(reason, limit) {
    super(
      reason === "records"
        ? `хранилище заполнено: разрешено ${limit} пресетов`
        : `хранилище заполнено: разрешено ${limit} байт`,
    );
    this.name = "StorageFull";
    /** @type {"records" | "bytes"} */
    this.reason = reason;
    /** @type {number} */
    this.limit = limit;
  }
}

/**
 * Машинное имя занято другой записью.
 *
 * Это НЕ проверка содержимого: хранилище сравнивает строку со строкой и не знает, что под этим
 * именем лежит. Уникальность держится здесь по единственной причине — только хранилище видит
 * все записи разом, и больше проверить её негде.
 */
export class NameTaken extends Error {
  /** @param {string} name */
  constructor(name) {
    super(`имя ${name} уже занято`);
    this.name = "NameTaken";
    /** @type {string} */
    this.taken = name;
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

  /** Сколько байт занято на диске записями из перечня. Держим счётчиком, а не обходом каталога. */
  let used = 0;

  /** @type {Map<string, number>} размер файла каждой записи — чтобы удаление освобождало ровно своё */
  const sizes = new Map();

  /** @type {Map<string, string>} машинное имя → идентификатор записи, которая его заняла */
  const names = new Map();

  /**
   * Сколько записей уже начали сохраняться, но ещё не попали в перечень. Без этого счётчика
   * два одновременных сохранения на последнем свободном месте оба прошли бы проверку предела:
   * место занимается СРАЗУ, а не после записи на диск.
   */
  let reserved = 0;

  /** То же самое для объёма: байты занимаются до записи, а не после. */
  let reservedBytes = 0;

  /** @type {Set<string>} имена начатых, но ещё не дописанных записей — иначе двое займут одно */
  const claimed = new Set();

  const entries = await readdir(dir);
  for (const entry of entries) {
    if (entry.startsWith(TMP_PREFIX)) {
      // Хвост от процесса, убитого посреди сохранения. Такой файл никто никогда не прочитает
      // (его имени нет в перечне), но копиться ему незачем.
      await unlink(join(dir, entry)).catch(() => {});
      continue;
    }
    if (!FILE.test(entry)) continue;

    const found = await readRecord(dir, entry);
    if (!found) continue;
    remember(found.record, found.bytes);
  }

  done(`каталог ${dir}, записей ${index.size}, занято ${used} Б`);

  /**
   * Внести запись в перечень: мета, размер, имя. Одно место на все три учёта — разъедься они,
   * и перечень начнёт расходиться с диском молча.
   *
   * @param {PresetRecord} record
   * @param {number} bytes
   */
  function remember(record, bytes) {
    index.set(record.id, meta(record));
    sizes.set(record.id, bytes);
    used += bytes;
    if (record.name === undefined) return;
    const holder = names.get(record.name);
    if (holder === undefined) {
      names.set(record.name, record.id);
      return;
    }
    // Совпадение имён МОЖЕТ лежать на диске: файлы кладут и руками, а прежний конверт имени не
    // знал вовсе. Отказываться подниматься из-за этого нельзя — служба перестала бы стартовать
    // на данных, которые сама же и приняла. Говорим вслух и оставляем имя за первым: обе записи
    // читаются по идентификатору, а чинится это удалением лишней.
    console.warn(
      `[probe-web-presets] имя ${record.name} занято записью ${holder}; запись ${record.id} лежит с тем же именем`,
    );
  }

  return {
    /** Сколько записей лежит сейчас. */
    get size() {
      return index.size;
    },

    /** Сколько байт занято записями сейчас. */
    get bytes() {
      return used;
    },

    /** Каталог, в котором лежат записи. */
    get dir() {
      return dir;
    },

    /**
     * Перечень — БЕЗ содержимого: список нужен для имён, тянуть ради него все состояния
     * незачем. Новые сверху: сохранённое только что человек ищет первым.
     *
     * Ярлык отбирает записи СРАВНЕНИЕМ СТРОКИ и ничем больше: хранилище не знает, что значит
     * `skin`, и не смотрит, что лежит под этим ярлыком внутри. Отбор по непрозрачной метке —
     * не толкование (`kb:PROBEWEB-8`): так почта различает конверты по адресу, не читая писем.
     *
     * Записи БЕЗ ярлыка в отбор по ярлыку не попадают — их вид не назван, и приписывать им
     * чужой значило бы толковать за отправителя.
     *
     * @param {{ kind?: string }} [filter] отбор по ярлыку вида; без него — все записи
     * @returns {PresetMeta[]}
     */
    list(filter = {}) {
      const done = trace("store.list");
      const wanted = filter.kind;
      const items = [...index.values()]
        .filter((item) => wanted === undefined || item.kind === wanted)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt) || a.id.localeCompare(b.id));
      done(`записей ${items.length}${wanted === undefined ? "" : ` по ярлыку ${wanted}`}`);
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
      const found = await readRecord(dir, `${id}.json`);
      done(found ? "отдано" : "файл пропал");
      return found?.record ?? null;
    },

    /**
     * Положить новую запись. Идентификатор и время выдаём мы — клиент их не присылает.
     *
     * `state` уходит на диск КАК ЕСТЬ. Ни одной проверки внутри него здесь нет и быть не
     * должно: это и есть правило зоны.
     *
     * @param {{ label: string, name?: string, description?: string, kind?: string, state: unknown }} input
     * @returns {Promise<PresetRecord>}
     * @throws {StorageFull} мест больше нет — в перечне или на диске
     * @throws {NameTaken} машинное имя занято другой записью
     */
    async create(input) {
      const done = trace("store.create");

      if (index.size + reserved >= limits.records) {
        throw new StorageFull("records", limits.records);
      }

      // Имя занимается ДО записи, как и место: два одновременных сохранения под одним именем
      // иначе оба прошли бы проверку и разъехались бы уже на диске.
      const wanted = input.name;
      if (wanted !== undefined && (names.has(wanted) || claimed.has(wanted))) {
        throw new NameTaken(wanted);
      }

      const id = randomUUID();
      /** @type {PresetRecord} */
      const record = {
        id,
        label: input.label,
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.kind === undefined ? {} : { kind: input.kind }),
        savedAt: new Date().toISOString(),
        state: input.state,
      };

      // Размер известен ДО записи — считаем его по тому же тексту, который уедет на диск, а не
      // по телу запроса: на диске лежит запись вместе с выданным конвертом, и учитывать надо её.
      const text = JSON.stringify(record);
      const bytes = Buffer.byteLength(text);
      if (used + reservedBytes + bytes > limits.totalBytes) {
        throw new StorageFull("bytes", limits.totalBytes);
      }

      reserved += 1;
      reservedBytes += bytes;
      if (wanted !== undefined) claimed.add(wanted);

      try {
        await writeAtomic(dir, `${id}.json`, text);
        remember(record, bytes);
        done(`записей ${index.size}, занято ${used} Б`);
        return record;
      } finally {
        reserved -= 1;
        reservedBytes -= bytes;
        if (wanted !== undefined) claimed.delete(wanted);
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
      const gone = index.get(id);
      if (!ID.test(id) || !gone || !index.delete(id)) {
        done("не найдено");
        return false;
      }
      used -= sizes.get(id) ?? 0;
      sizes.delete(id);
      // Имя освобождается, только если его держала ИМЕННО эта запись: при совпадении имён на
      // диске держателем остаётся первый, и удаление второго не должно отдавать чужое имя.
      if (gone.name !== undefined && names.get(gone.name) === id) names.delete(gone.name);
      await unlink(join(dir, `${id}.json`)).catch(() => {});
      await syncDir(dir);
      done(`записей ${index.size}, занято ${used} Б`);
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
    ...(record.name === undefined ? {} : { name: record.name }),
    ...(record.description === undefined ? {} : { description: record.description }),
    ...(record.kind === undefined ? {} : { kind: record.kind }),
    savedAt: record.savedAt,
  };
}

/**
 * Прочитать файл записи. Битый файл НЕ роняет службу и не подменяется пустышкой: он
 * пропускается, а событие называется вслух — иначе запись исчезает молча, и никто не узнает.
 *
 * Отдаёт вместе с РАЗМЕРОМ прочитанного: занятый объём считается по тому, что лежит на диске,
 * и мерить его отдельным обходом каталога значило бы завести вторую истину о том же.
 *
 * @param {string} dir
 * @param {string} name
 * @returns {Promise<{ record: PresetRecord, bytes: number } | null>}
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
    // Ярлык необязателен — записи прошлого конверта его не имеют. Но если он есть, то это
    // строка: ярлык-число или ярлык-объект в файле значит, что запись писали не мы.
    if (record.kind !== undefined && typeof record.kind !== "string") {
      throw new Error("ярлык вида не строка");
    }
    // То же и про машинное имя: необязательно, но если есть — строка. По нему строится перечень
    // занятых имён, и имя-объект отравило бы его молча.
    if (record.name !== undefined && typeof record.name !== "string") {
      throw new Error("машинное имя не строка");
    }
    return { record: /** @type {PresetRecord} */ (record), bytes: Buffer.byteLength(text) };
  } catch (error) {
    console.warn(
      `[probe-web-presets] файл ${name} пропущен: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}
