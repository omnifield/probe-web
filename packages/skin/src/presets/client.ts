// Полный CRUD по каждому виду записи службы раздачи. Имя — довод операции, не поле содержимого
// (`ComponentAssembly` своего имени не несёт). Разбор — FAQ.md.

import type { ComponentAssembly, Form, Outfit, Palette } from "../engine/look/index.js";
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
  /** Перечень записей вида со содержимым — N+1-запрос делает клиент, не тот, кто его зовёт. */
  list<K extends PresetKind>(kind: K): Promise<readonly PresetRecord<PresetKindState[K]>[]>;

  /** Запись по имени, либо `undefined` — такой в службе нет. */
  get<K extends PresetKind>(kind: K, name: string): Promise<PresetRecord<PresetKindState[K]> | undefined>;

  /** Кладёт новую запись. Уникальность имени держит служба. */
  save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /** Кладёт запись вместо прежней с тем же именем и ярлыком (снять, потом положить). */
  replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /** Убирает запись по имени и ярлыку. Имени нет — уже убрано, а не отказ. */
  remove(kind: PresetKind, name: string): Promise<void>;
}

/** Чем заводится клиент. */
export interface PresetsClientOptions {
  /** Адрес службы раздачи, ДО `?kind=` — `{base}` контракта. */
  readonly url: string;
}

/** Заводит клиент службы раздачи по одному адресу; общего состояния между экземплярами нет. */
export function createPresetsClient(options: PresetsClientOptions): PresetsClient {
  const { url } = options;

  /** Перечень записей одного вида без содержимого. Записи без машинного имени неадресуемы. */
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
