// Design notes: ../README.md#presets
//
// ПОЛНЫЙ CRUD ПО КАЖДОМУ ВИДУ ЗАПИСИ (`PWEB-216`) — контракт службы один на все четыре ярлыка
// (`palette`/`form`/`outfit`/`assembly`), и понимание этого контракта не продуктовое знание
// (тот же довод, что у `PWEB-214`/`PWEB-215`): кто бы ни звал службу раздачи, ему нужны ровно эти
// пять операций и ни разу — свой `fetch`.
//
// ## Имя — ДОВОД, а не поле содержимого
//
// `Palette`/`Form`/`Outfit` несут своё `name` — но `ComponentAssembly` его не несёт (у неё
// `component`+`assembly`, и на то есть причина: кодовая сборка кита живёт в `editorInfo.
// assemblies` тем же типом и никогда не была записью с собственным именем). Выведи клиент имя из
// содержимого — четвёртый ярлык не завёлся бы вовсе, а требование «симметричный набор по каждому
// виду» стоит явно. Поэтому имя — отдельный довод `save`/`replace`/`get`/`remove`, один и тот же
// по форме для всех четырёх ярлыков.
//
// Для palette/form/outfit это накладывает молчаливое ожидание — `state.name` совпадает с
// переданным `name`: `assemble`/`checkOutfit` читают имя ИЗ СОДЕРЖИМОГО (`outfit.palette`
// ищется по `Palette.name`), а не из обёртки записи. Клиент это не проверяет и не может: у
// `ComponentAssembly` поля `name` попросту нет, а вводить проверку на три ярлыка из четырёх —
// заводить для четвёртого молчаливое исключение.

import type { ComponentAssembly, Form, Outfit, Palette } from "../look/index.js";
import { ask, PresetsRefused } from "./wire.js";

/** Ярлыки вида: по ним служба отбирает записи, не толкуя ни одной. */
export const PRESET_KIND = {
  palette: "palette",
  form: "form",
  outfit: "outfit",
  assembly: "assembly",
} as const;

export type PresetKind = (typeof PRESET_KIND)[keyof typeof PRESET_KIND];

/** Содержимое по ярлыку — то, что действительно лежит под `state`. */
interface PresetKindState {
  palette: Palette;
  form: Form;
  outfit: Outfit;
  assembly: ComponentAssembly;
}

/** Запись службы ЦЕЛИКОМ — то же самое, что несёт `GET {base}/{id}`, типизированное содержимым. */
export interface PresetRecord<T> {
  /** Идентификатор записи — только для человека в отладчике; операции клиента адресуют ИМЕНЕМ. */
  readonly id: string;
  /** Имя для человека. */
  readonly label: string;
  /** Имя для машины — им запись зовут наряд и источник. */
  readonly name: string;
  /** Содержимое: Palette/Form/Outfit/ComponentAssembly — по ярлыку. */
  readonly state: T;
}

/** Чужой ответ разбирается, а не приводится типом. */
interface WireRecord {
  id?: unknown;
  label?: unknown;
  name?: unknown;
  state?: unknown;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Клиент службы раздачи: по каждому виду — перечень, чтение, запись, замена, удаление. */
export interface PresetsClient {
  /**
   * Перечень записей вида — СО СОДЕРЖИМЫМ, не только именами. Служба отдаёт перечень и
   * содержимое разными ответами (`?kind=` — без него, `/id` — с ним); N+1 запрос делает клиент,
   * параллельно, не тот, кто его зовёт.
   */
  list<K extends PresetKind>(kind: K): Promise<readonly PresetRecord<PresetKindState[K]>[]>;

  /** Запись по имени, либо `undefined` — такой в службе нет. */
  get<K extends PresetKind>(kind: K, name: string): Promise<PresetRecord<PresetKindState[K]> | undefined>;

  /**
   * Кладёт НОВУЮ запись. Уникальность имени держит служба — отказ на занятое имя приходит
   * оттуда: только она видит все записи разом.
   *
   * @param label имя для человека; не названо — берётся машинное
   */
  save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /**
   * Кладёт запись ВМЕСТО прежней с тем же именем и ярлыком.
   *
   * Правок служба не знает — принимает запись целиком и отдаёт ей новый идентификатор, поэтому
   * замена — два шага (снять, положить), и делает их клиент одним вызовом: два потребителя,
   * написавшие эту пару каждый сам, рано или поздно разойдутся порядком шагов.
   */
  replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /** Убирает запись по имени и ярлуку. Имени нет — уже убрано, а не отказ (см. README). */
  remove(kind: PresetKind, name: string): Promise<void>;
}

/** Чем заводится клиент. */
export interface PresetsClientOptions {
  /** Адрес службы раздачи, ДО `?kind=` — `{base}` контракта. */
  readonly url: string;
}

/**
 * Заводит клиент службы раздачи. Один вызов — один адрес; общего состояния между экземплярами
 * нет, и любое число приложений заводит свой клиент своим адресом без единой правки друг у друга.
 */
export function createPresetsClient(options: PresetsClientOptions): PresetsClient {
  const { url } = options;

  /** Перечень записей одного вида — без содержимого. Записи без машинного имени неадресуемы. */
  async function wireList(kind: string): Promise<WireRecord[]> {
    const response = await ask(`${url}?kind=${kind}`);
    const body: unknown = await response.json();
    const items: unknown = (body as { items?: unknown }).items;

    if (!Array.isArray(items)) throw new PresetsRefused("служба раздачи ответила не перечнем");

    return items.map((item) => item as WireRecord).filter((item) => text(item.name) !== "" && text(item.id) !== "");
  }

  function toRecord<T>(item: WireRecord): PresetRecord<T> {
    if (item.state === null || typeof item.state !== "object") {
      throw new PresetsRefused(`запись «${text(item.id)}» пуста`);
    }

    return {
      id: text(item.id),
      label: text(item.label) === "" ? text(item.name) : text(item.label),
      name: text(item.name),
      state: item.state as T,
    };
  }

  async function wireRead<T>(id: string): Promise<PresetRecord<T>> {
    const response = await ask(`${url}/${encodeURIComponent(id)}`);
    return toRecord<T>((await response.json()) as WireRecord);
  }

  async function list<K extends PresetKind>(kind: K): Promise<readonly PresetRecord<PresetKindState[K]>[]> {
    const items = await wireList(kind);
    return Promise.all(items.map((item) => wireRead<PresetKindState[K]>(item.id as string)));
  }

  async function get<K extends PresetKind>(
    kind: K,
    name: string,
  ): Promise<PresetRecord<PresetKindState[K]> | undefined> {
    const item = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    return item === undefined ? undefined : wireRead<PresetKindState[K]>(item.id as string);
  }

  async function save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const response = await ask(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: label ?? name, name, kind, state }),
    });

    const body = (await response.json()) as WireRecord;
    return { id: text(body.id), label: text(body.label), name: text(body.name), state };
  }

  async function replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const existing = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    if (existing !== undefined) await ask(`${url}/${encodeURIComponent(text(existing.id))}`, { method: "DELETE" });

    return save(kind, name, state, label);
  }

  async function remove(kind: PresetKind, name: string): Promise<void> {
    const existing = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    // Имени нет — оно уже убрано (или никогда не было): DELETE идемпотентен по смыслу, а не
    // только по HTTP-методу. Второй вызов `remove` с тем же именем — не отказ.
    if (existing === undefined) return;

    await ask(`${url}/${encodeURIComponent(text(existing.id))}`, { method: "DELETE" });
  }

  return { list, get, save, replace, remove };
}
